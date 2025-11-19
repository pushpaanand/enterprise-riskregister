# Static Assets Folder

This folder contains static image assets that will be served at `/components/assets/` in production.

## Required Files

Please copy the following image files from `components/assets/` to this `public/components/assets/` folder:

1. `logo.png` - Main logo image
2. `kauvery_logo.png` - Favicon logo

## How it works

- Vite automatically copies all files from the `public` folder to the root of the `dist` folder during build
- Files in `public/components/assets/` will be available at `/components/assets/` in the deployed app
- This ensures images work correctly on Azure Static Web Apps

