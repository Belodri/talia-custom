# **Git Workflow**

This document explains the Git workflow used for this project. It is designed to maintain a clean history and ensure proper versioning for releases.

---

## **Branches**

### **1. `main`**
- The `main` branch is the core of this project and always contains the latest stable code.
- All feature development branches start from `main` and are merged back into it when complete.

### **2. Feature Branches**
- Feature branches are created from `main` for developing new features, fixes, or updates.
- Naming is flexible; feature branches can be named anything that is:
  - **Unique:** does not conflict with existing branches or tags.
  - **Descriptive:** to easily recognise the branch's purpose.

---

## **Workflow Process**

### **1. Creating a Feature Branch**
1. Start a new branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b <branch-name>
   ```
2. Make changes, commit them locally, and push to GitHub:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push -u origin <branch-name>
   ```

---

### **2. Merging a Feature Branch**
1. Once the feature is tested and ready:
   - Squash and merge the branch into `main` via a pull request on GitHub.
   - This ensures that only a single commit is added to `main` for the feature.

2. Delete the feature branch after merging to keep the repository clean:
   ```bash
   git branch -d <branch-name>
   git push origin --delete <branch-name>
   ```

---

### **3. Releasing a Version**
1. Ensure `main` contains all the changes for the release.
2. If needed, create a new branch for last-minute fixes or updates (treated like a feature branch):
   ```bash
   git checkout main
   git checkout -b release-fix
   ```
3. After completing any fixes, merge them into `main`.

4. Create a release on GitHub:
   - Go to the **Releases** section in GitHub and draft a release.
   - Add the tag and release notes for better tracking.

---

### **4. Updating Changelog**
- Maintain a `CHANGELOG.md` file in the root of the repository.
- Update it in the same branch where changes are made, or as part of the release process.

---

## **Additional Notes**

1. **No Direct Commits to `main`**:
   - All changes must go through feature branches.

2. **Clean History**:
   - Always use squash merges to avoid cluttering the commit history with intermediate or incomplete work.

3. **Tags and Releases**:
   - Tags identify specific releases (e.g., `v1.0.0`, `v1.1.0`).
