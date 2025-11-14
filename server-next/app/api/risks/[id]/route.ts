import { NextResponse } from 'next/server';
import { getPool } from '../../../../lib/db';

export const runtime = 'nodejs';

function withCORS(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  return res;
}

export async function OPTIONS() {
  return withCORS(new NextResponse(null, { status: 204 }));
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const riskId = params.id;
    if (!riskId) {
      return withCORS(NextResponse.json({ error: 'Missing risk id' }, { status: 400 }));
    }
    const body = await req.json();
    const {
      name,
      description,
      impact,
      likelihood,
      status,
      identification,
      existingControlInPlace,
      planOfAction,
      categoryId,
      changedByUserId, // optional: who made the change (GUID)
    } = body || {};

    const pool = await getPool();

    // Load existing row to detect changes
    const existingSel = await pool.request().input('RiskId', riskId).query(`
      SELECT Name, Description, Impact, Likelihood, Status, Identification, ExistingControlInPlace, PlanOfAction, CategoryId
      FROM dbo.Risks WHERE RiskId = @RiskId
    `);
    const existing = existingSel.recordset[0] || {};

    const rq = pool.request();
    rq.input('RiskId', riskId);
    if (name !== undefined) rq.input('Name', name);
    if (description !== undefined) rq.input('Description', description);
    if (impact !== undefined) rq.input('Impact', impact);
    if (likelihood !== undefined) rq.input('Likelihood', likelihood);
    if (status !== undefined) rq.input('Status', status);
    if (identification !== undefined) rq.input('Identification', identification);
    if (existingControlInPlace !== undefined) rq.input('ExistingControlInPlace', existingControlInPlace);
    if (planOfAction !== undefined) rq.input('PlanOfAction', planOfAction);
    if (categoryId !== undefined) rq.input('CategoryId', categoryId);

    // Build dynamic SET clause only for provided fields
    const sets: string[] = [];
    if (name !== undefined) sets.push('Name = @Name');
    if (description !== undefined) sets.push('Description = @Description');
    if (impact !== undefined) sets.push('Impact = @Impact');
    if (likelihood !== undefined) sets.push('Likelihood = @Likelihood');
    if (status !== undefined) sets.push('Status = @Status');
    if (identification !== undefined) sets.push('Identification = @Identification');
    if (existingControlInPlace !== undefined) sets.push('ExistingControlInPlace = @ExistingControlInPlace');
    if (planOfAction !== undefined) sets.push('PlanOfAction = @PlanOfAction');
    if (categoryId !== undefined) sets.push('CategoryId = @CategoryId');
    sets.push('UpdatedAtUtc = SYSUTCDATETIME()');

    if (sets.length === 0) {
      return withCORS(NextResponse.json({ ok: true }));
    }

    const sql = `
      UPDATE dbo.Risks
      SET ${sets.join(', ')}
      WHERE RiskId = @RiskId
    `;
    await rq.query(sql);

    // Insert history rows for changed fields
    const changes: Array<{ field: string; oldVal: any; newVal: any }> = [];
    if (name !== undefined && name !== existing.Name) changes.push({ field: 'Name', oldVal: existing.Name, newVal: name });
    if (description !== undefined && description !== existing.Description) changes.push({ field: 'Description', oldVal: existing.Description, newVal: description });
    if (impact !== undefined && impact !== existing.Impact) changes.push({ field: 'Impact', oldVal: existing.Impact, newVal: impact });
    if (likelihood !== undefined && likelihood !== existing.Likelihood) changes.push({ field: 'Likelihood', oldVal: existing.Likelihood, newVal: likelihood });
    if (status !== undefined && status !== existing.Status) changes.push({ field: 'Status', oldVal: existing.Status, newVal: status });
    if (identification !== undefined && identification !== existing.Identification) changes.push({ field: 'Identification', oldVal: existing.Identification, newVal: identification });
    if (existingControlInPlace !== undefined && existingControlInPlace !== existing.ExistingControlInPlace) changes.push({ field: 'ExistingControlInPlace', oldVal: existing.ExistingControlInPlace, newVal: existingControlInPlace });
    if (planOfAction !== undefined && planOfAction !== existing.PlanOfAction) changes.push({ field: 'PlanOfAction', oldVal: existing.PlanOfAction, newVal: planOfAction });
    if (categoryId !== undefined && categoryId !== existing.CategoryId) changes.push({ field: 'CategoryId', oldVal: existing.CategoryId, newVal: categoryId });

    if (changes.length) {
      const histRq = pool.request();
      histRq.input('RiskId', riskId);
      if (changedByUserId) histRq.input('ChangedByUserId', changedByUserId);
      // Build a multi-values insert
      const valuesSql: string[] = [];
      changes.forEach((c, idx) => {
        histRq.input(`Field${idx}`, String(c.field));
        histRq.input(`Old${idx}`, c.oldVal === undefined || c.oldVal === null ? null : String(c.oldVal));
        histRq.input(`New${idx}`, c.newVal === undefined || c.newVal === null ? null : String(c.newVal));
        valuesSql.push(`(@RiskId, SYSUTCDATETIME(), ${changedByUserId ? '@ChangedByUserId' : 'NULL'}, @Field${idx}, @Old${idx}, @New${idx})`);
      });
      const insSql = `
        INSERT INTO dbo.RiskHistory (RiskId, ChangedAtUtc, ChangedByUserId, FieldName, OldValue, NewValue)
        VALUES ${valuesSql.join(',')};
      `;
      await histRq.query(insSql);
    }

    return withCORS(NextResponse.json({ ok: true }));
  } catch (e: any) {
    return withCORS(NextResponse.json({ error: String(e?.message || e) }, { status: 500 }));
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const riskId = params.id;
    if (!riskId) {
      return withCORS(NextResponse.json({ error: 'Missing risk id' }, { status: 400 }));
    }
    const pool = await getPool();
    const rq = pool.request();
    rq.input('RiskId', riskId);
    // Remove dependent incidents first (foreign key protection)
    await rq.query(`DELETE FROM dbo.incidents_t WHERE RiskId = @RiskId`);
    // Delete risk
    const result = await rq.query(`DELETE FROM dbo.Risks WHERE RiskId = @RiskId`);
    // rowsAffected: [count] for each statement; second delete is at index 1 sometimes, but we can just reply ok
    return withCORS(NextResponse.json({ ok: true }));
  } catch (e: any) {
    return withCORS(NextResponse.json({ error: String(e?.message || e) }, { status: 500 }));
  }
}

