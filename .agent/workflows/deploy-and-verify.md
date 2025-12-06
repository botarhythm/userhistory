---
description: Deploy changes to Railway production and automatically verify the build and deployment status.
---

This workflow automates the deployment process to Railway and ensures that the deployment is verified immediately after pushing changes.

1.  **Push Changes to GitHub**
    Push the current branch to `main` to trigger the Railway deployment.
    ```bash
    git push origin main
    ```

2.  **Monitor Deployment Status**
    Wait for the deployment to initialize and complete.
    // turbo
    ```bash
    npm run railway:status
    ```
    *Note: If the status is "BUILDING" or "INITIALIZING", wait a few moments and retry this step until it returns "DEPLOYED" or "FAILED".*

3.  **Verify Deployment**
    
    **If Status is "DEPLOYED":**
    Run a health check to ensure the application is responding correctly.
    // turbo
    ```bash
    npm run railway:health
    ```

    **If Status is "FAILED":**
    Retrieve the build/deployment logs to diagnose the issue.
    // turbo
    ```bash
    npm run railway:logs
    ```

4.  **Final Confirmation**
    If specific features were modified, verify them in the browser or via API calls against the production URL:
    `https://userhistory-production.up.railway.app`
