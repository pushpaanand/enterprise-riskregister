import { NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';

export const runtime = 'nodejs';

function isGuid(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const re = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const nil = /^00000000-0000-0000-0000-000000000000$/;
  return re.test(value) || nil.test(value);
}

export async function GET() {
  const pool = await getPool();
  const rs = await pool.request().query(`
    SELECT r.RiskId, r.RiskNo, r.DepartmentId, d.Name AS Department, r.Name, r.Description,
           r.CategoryId,
           r.Identification, r.ExistingControlInPlace, r.PlanOfAction,
           r.Impact, r.Likelihood, r.Status, r.OwnerId, o.Name AS Owner,
           r.CreatedByUserId, u.Name AS CreatedByName,
           r.CreatedAtUtc, r.UpdatedAtUtc
    FROM dbo.Risks r
    JOIN dbo.Departments d ON d.DepartmentId = r.DepartmentId
    LEFT JOIN dbo.Owners o ON o.OwnerId = r.OwnerId
    LEFT JOIN dbo.Users u ON u.UserId = r.CreatedByUserId
    ORDER BY d.Name, r.RiskNo
  `);
  const res = NextResponse.json(rs.recordset);
  res.headers.set('Access-Control-Allow-Origin', '*');
  return res;
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return res;
}

export async function POST(req: Request) {
  const body = await req.json();
  const pool = await getPool();
  // Resolve DepartmentId if not provided using CreatedByUserId
  let departmentId = body.departmentId || null;
  if (!departmentId && body.createdByUserId) {
    if (isGuid(body.createdByUserId)) {
      const dep = await pool.request().input('uid', body.createdByUserId).query(`SELECT DepartmentId FROM dbo.Users WHERE UserId = @uid`);
      if (dep.recordset.length) departmentId = dep.recordset[0].DepartmentId;
    }
  }
  // Fallback: try resolve by creator name if provided
  if (!departmentId && body.createdByName) {
    const depByName = await pool.request().input('uname', body.createdByName).query(`
      SELECT TOP 1 DepartmentId FROM dbo.Users WHERE Name = @uname
    `);
    if (depByName.recordset.length) departmentId = depByName.recordset[0].DepartmentId;
  }
  if (!departmentId) {
    const depAny = await pool.request().query(`SELECT TOP 1 DepartmentId FROM dbo.Departments ORDER BY Name`);
    departmentId = depAny.recordset[0]?.DepartmentId || null;
  }
  // Auto-generate risk number if missing
  let riskNo = body.riskNo || null;
  if (!riskNo && departmentId) {
    const rsNo = await pool.request().input('dep', departmentId).query(`
      SELECT MAX(CAST(SUBSTRING(RiskNo, 2, 10) AS INT)) AS MaxNo
      FROM dbo.Risks WHERE DepartmentId = @dep AND ISNUMERIC(SUBSTRING(RiskNo,2,10))=1
    `);
    const nextNo = (rsNo.recordset[0]?.MaxNo || 0) + 1;
    riskNo = `R${String(nextNo).padStart(3,'0')}`;
  }
  const rq = pool.request();
  rq.input('DepartmentId', departmentId);
  rq.input('RiskNo', riskNo || body.riskNo);
  rq.input('Name', body.name);
  rq.input('Description', body.description);
  rq.input('Impact', body.impact);
  rq.input('Likelihood', body.likelihood);
  rq.input('Status', body.status);
  // Resolve OwnerId: ensure non-null to satisfy NOT NULL constraint
  let ownerIdToUse: string | null = isGuid(body.ownerId) ? body.ownerId : null;
  if (!ownerIdToUse) {
    // Prefer an owner from the database if any exist
    const ownerAny = await pool.request().query(`SELECT TOP 1 OwnerId FROM dbo.Owners ORDER BY Name`);
    ownerIdToUse = ownerAny.recordset[0]?.OwnerId || null;
  }
  if (!ownerIdToUse) {
    // Create a fallback owner
    const createdOwner = await pool.request().input('OwnerName', 'Default Owner').query(`
      DECLARE @oid UNIQUEIDENTIFIER = NEWID();
      INSERT INTO dbo.Owners (OwnerId, Name) VALUES (@oid, @OwnerName);
      SELECT @oid AS OwnerId;
    `);
    ownerIdToUse = createdOwner.recordset[0]?.OwnerId || null;
  }
  rq.input('OwnerId', ownerIdToUse);
  rq.input('CreatedByUserId', isGuid(body.createdByUserId) ? body.createdByUserId : null);
  rq.input('CategoryId', body.categoryId || null);
  rq.input('Identification', body.identification || null);
  rq.input('ExistingControlInPlace', body.existingControlInPlace || null);
  rq.input('PlanOfAction', body.planOfAction || null);
  const ins = await rq.query(`
    DECLARE @id UNIQUEIDENTIFIER = NEWID();
    INSERT INTO dbo.Risks (RiskId, DepartmentId, RiskNo, Name, Description, CategoryId, Identification, ExistingControlInPlace, PlanOfAction, Impact, Likelihood, Status, OwnerId, CreatedByUserId, CreatedAtUtc, UpdatedAtUtc)
    VALUES (@id, @DepartmentId, @RiskNo, @Name, @Description, @CategoryId, @Identification, @ExistingControlInPlace, @PlanOfAction, @Impact, @Likelihood, @Status, @OwnerId, @CreatedByUserId, SYSUTCDATETIME(), SYSUTCDATETIME());
    SELECT r.RiskId, r.RiskNo, r.DepartmentId, d.Name AS Department, r.Name, r.Description,
           r.CategoryId, r.Identification, r.ExistingControlInPlace, r.PlanOfAction,
           r.Impact, r.Likelihood, r.Status, r.OwnerId,
           r.CreatedByUserId, u.Name AS CreatedByName,
           r.CreatedAtUtc, r.UpdatedAtUtc
    FROM dbo.Risks r
    JOIN dbo.Departments d ON d.DepartmentId = r.DepartmentId
    LEFT JOIN dbo.Users u ON u.UserId = r.CreatedByUserId
    WHERE r.RiskId = @id;
  `);
  const newRisk = ins.recordset[0];
  // Notify department managers via SMTP (best effort)
  try {
    const mgrs = await pool.request().input('dep', newRisk.DepartmentId).query(`
      SELECT TOP 5 Email FROM dbo.Users WHERE Role = 'manager' AND DepartmentId = @dep AND Email IS NOT NULL
    `);
    if (mgrs.recordset.length) {
      const to = mgrs.recordset.map((m:any)=>m.Email).join(',');
      const toList: string[] = mgrs.recordset.map((m:any)=>String(m.Email));
      // @ts-ignore - nodemailer types not required on server
      const { default: nodemailer } = await import('nodemailer');
      const from = process.env.SMTP_FROM || (process.env.SMTP_USER || 'productanalyst.pushpa@kauveryhospital.com');
      const subject = `Approval needed: ${newRisk.RiskNo} - ${newRisk.Name}`;
      const text = `Dear Manager,\n\nA new risk has been raised and requires your approval.\n\nRisk ID: ${newRisk.RiskNo}\nTitle: ${newRisk.Name}\nRaised By: ${newRisk.CreatedByName || 'Unknown'}\nImpact: ${newRisk.Impact}\nLikelihood: ${newRisk.Likelihood}\nIdentification: ${newRisk.Identification || ''}\nStatus: ${newRisk.Status}\n\nPlease log in to review and take action.\n\nThanks.`;

      // Skip email entirely if disabled
      const smtpEnabled = (process.env.SMTP_ENABLED || 'true').toLowerCase() !== 'false';
      if (!smtpEnabled) {
        console.warn('Email notify skipped: SMTP_ENABLED=false');
      } else {
        // Prepare optional Graph fallback
        const tenant = process.env.MS_TENANT_ID;
        const clientId = process.env.MS_CLIENT_ID;
        const clientSecret = process.env.MS_CLIENT_SECRET;
        const graphSender = process.env.MS_GRAPH_SENDER || from;
        const canUseGraph = Boolean(tenant && clientId && clientSecret && graphSender);
        const sendViaGraph = async () => {
          // Get token
          const tokenResp = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId!,
              client_secret: clientSecret!,
              scope: 'https://graph.microsoft.com/.default',
              grant_type: 'client_credentials'
            })
          });
          if (!tokenResp.ok) {
            const t = await tokenResp.text();
            throw new Error(`Graph token failed: ${tokenResp.status} ${t}`);
          }
          const tokenJson: any = await tokenResp.json();
          const accessToken = tokenJson.access_token as string;
          // Send email via Graph
          const recipients = toList.map(addr => ({ emailAddress: { address: addr } }));
          const graphBody = {
            message: {
              subject,
              body: { contentType: 'Text', content: text },
              toRecipients: recipients
            },
            saveToSentItems: 'false'
          };
          const graphResp = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(graphSender)}/sendMail`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(graphBody)
          });
          if (!graphResp.ok) {
            const gtxt = await graphResp.text();
            throw new Error(`Graph sendMail failed: ${graphResp.status} ${gtxt}`);
          }
          console.info('Email sent via Microsoft Graph');
        };

        // Try SMTP with Gmail only
        const isGmail = true;
        const smtpSecure = false; // Gmail via STARTTLS on 587 by default
        const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'true';
        const smtpUser = (process.env.SMTP_USER || 'productanalyst.pushpa@kauveryhospital.com').trim();
        const smtpPass = (process.env.SMTP_PASS || 'fprg nbfn ftat hngt').trim();
        const hasSmtpCreds = smtpUser !== '' && smtpPass !== '';
console.log('hasSmtpCreds', smtpUser, smtpPass);
        // If SMTP credentials are missing, prefer Graph fallback (if configured)
        if (!hasSmtpCreds) {
          if (canUseGraph) {
            try {
              await sendViaGraph();
            } catch (graphErr) {
              console.error('Email notify failed via Graph (no SMTP creds)', graphErr);
            }
          } else {
            console.error('Email notify skipped: missing SMTP_USER/SMTP_PASS and no Graph credentials configured');
          }
          // Stop further SMTP attempts
          return;
        }

        const auth = { user: smtpUser, pass: smtpPass };
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth,
          tls: { rejectUnauthorized },
          debug: process.env.SMTP_DEBUG === 'true',
        });
        try {
          await transporter.sendMail({ from, to, subject, text });
        } catch (smtpErr: any) {
          // On SMTP auth failure, optionally fall back to Microsoft Graph if configured
          const maybeEAUTH = (smtpErr && (smtpErr.code === 'EAUTH' || `${smtpErr}`.includes('535') || `${smtpErr}`.toLowerCase().includes('missing credentials'))) ? true : false;
          if (maybeEAUTH && canUseGraph) {
            try {
              await sendViaGraph();
            } catch (graphErr) {
              console.error('Email notify failed via SMTP and Graph', graphErr);
            }
          } else {
            console.error('Email notify failed via SMTP', smtpErr);
          }
        }
      }
    }
  } catch (e) {
    console.error('Email notify failed', e);
  }
  const res = NextResponse.json({ ok: true, risk: newRisk }, { status: 201 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  return res;
}