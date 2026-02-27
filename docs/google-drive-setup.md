## Google Drive connection for DHSA Sports

This document explains, in plain language, how the DHSA Sports system is connected to a personal Google (Gmail) account and its Google Drive folders.

It is written for non-technical staff. You do not need to know how to code to understand or use this.

### 1. What this Google Drive connection does

- **Automatic storage**: When the DHSA Sports system needs to store documents (for example, forms, IDs, or medical letters), it sends them straight into a specific folder inside a personal Google Drive account.
- **Automatic retrieval**: When someone views or downloads a document from inside the DHSA Sports system, the system quietly fetches the file from that same Google Drive folder in the background.
- **Goal**: Staff can manage documents through the sports system, while the actual files live safely in Google Drive.

Think of it as:

> “The sports system is a smart front door to a special folder in Google Drive.”

### 2. Which Google account is connected

- The connection uses **one specific personal Gmail account** (for example: `someone@example.com` – replace this with the real address in your copy of this document).
- All files created by the DHSA Sports system are stored under **that account’s Google Drive**, inside a chosen main folder.
- If you sign in to that Gmail account and open Google Drive, you will see the folder and its files there.

Anyone who can sign in to that Gmail account (or who is given access to the folder in Drive) can also open these files directly in Google Drive.

### 3. One-time setup that has already been done

This section describes what has already been set up behind the scenes. You do **not** need to repeat these steps unless you change the Google account or want to re-connect from scratch.

#### 3.1. Registering the app with Google

A developer has:

- Logged into the **Google Cloud Console** using the personal Gmail account.
- Created an “app” there and received:
  - a **Client ID**
  - a **Client Secret**
- Set a **Redirect URL** (currently `http://localhost`) so Google knows where to send a one‑time code back during setup.

These three pieces of information were then stored in the system’s secret settings file (`.env`) using the names:

- `GOOGLE_DRIVE_CLIENT_ID`
- `GOOGLE_DRIVE_CLIENT_SECRET`
- `GOOGLE_DRIVE_REDIRECT_URI`

You can think of these as the **ID badge** for our sports system when it talks to Google.

#### 3.2. Allowing the app to access Google Drive once

Next, the developer ran a small helper script called `generate-drive-refresh-token`.

In simple terms, this script:

1. Showed a special Google link in the terminal.
2. The developer opened that link in a browser.
3. They logged in with the **personal Gmail account** that will own the Drive folder.
4. Google displayed a screen asking them to **Allow** the app to create and read files in that Google Drive.
5. After clicking Allow, Google showed a one‑time **code**.
6. The developer copied that code back into the script window.

Google then gave back a long, secret value called a **refresh token**. This token:

- Was saved in the `.env` file as `GOOGLE_DRIVE_REFRESH_TOKEN`.
- Allows the sports system to act on behalf of that Google account in the future **without** asking anyone to log in again.

You can think of the refresh token as:

> “A long‑lasting permission slip that says: this app is allowed to work with files it creates in this Google Drive.”

This was a **one-time** action. It only needs to be repeated if you switch to a different Google account or fully reset the connection.

### 4. How the app knows which folder to use

Inside Google Drive, the developer chose (or created) a **main folder** where all sports-related documents should live.

For example:

- A folder named `DHSA Sports Documents` inside the connected Google Drive.

Every folder in Google Drive has a unique ID in its web address. The developer:

1. Opened the folder in Google Drive.
2. Copied the long ID from the URL.
3. Saved that ID in the `.env` file as `GOOGLE_DRIVE_FOLDER_ID`.

From then on:

- Whenever the sports system uploads a file, it sends it **into that exact folder**.
- The system remembers the Google Drive file ID so it can find the file again later.

You can think of `GOOGLE_DRIVE_FOLDER_ID` as:

> “The GPS coordinates for the main folder where all app files should go.”

### 5. Where information actually lives

There are two places to think about:

- **Inside the sports system (database)**:
  - The system stores **references** to files (for example, the Google Drive file ID) and some basic information about them.
  - It does **not** store the full content of the documents themselves.
- **Inside Google Drive**:
  - The real files (PDFs, images, scans, etc.) live in the main folder identified by `GOOGLE_DRIVE_FOLDER_ID`.
  - These are standard Google Drive files and can be opened directly from Google Drive if you have access.

So when a coach or admin uploads a document through the app:

1. The file is sent to the configured Google Drive folder.
2. The app keeps a note of the file’s ID.
3. Later, when someone wants to see that document, the app uses the file ID to pull it back from Google Drive and show or download it.

### 6. Privacy and access, in human terms

It helps to separate **Google access** from **sports system access**:

- **Google access** (who can open files directly in Google Drive):
  - Anyone who can sign into the connected Gmail account can see all files in that Google Drive (subject to how Drive is organized).
  - The main document folder (set by `GOOGLE_DRIVE_FOLDER_ID`) can also be shared with specific people, just like any other Google Drive folder.
- **Sports system access** (who can see files through the app):
  - Within the DHSA Sports system, only users with the right permissions (roles) will see document links or previews.
  - This is controlled by the app’s own user and role system, **separate** from Google.

Important points:

- The app can only work within the scope of the permissions that were granted during the one-time “Allow” step.
- If you ever want to fully disconnect, you can revoke the app’s access from the Google account’s security settings and/or remove the tokens from the `.env` file.

### 7. Changing the connected account or folder later

You might want to:

- Move from one personal Gmail to another.
- Move from a personal Gmail to a shared club or organization Google account.
- Use a different main folder within the same Drive.

Here is the high-level process (a developer will usually do this):

#### 7.1. Switching to a different Google account

1. Sign into Google Cloud Console with the **new** Gmail/Google account.
2. Create a new app (or OAuth client) there and note the:
   - Client ID
   - Client Secret
3. Update the `.env` file with the new values:
   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_REDIRECT_URI` (if it changes)
4. Run the `generate-drive-refresh-token` script again, this time while logged into the **new** Gmail account:
   - Open the link it shows.
   - Click Allow when Google asks for permission.
   - Paste the code back into the script.
   - Copy the new refresh token and save it as `GOOGLE_DRIVE_REFRESH_TOKEN` in `.env`.

At this point, the sports system will be connected to the new Google account instead of the old one.

#### 7.2. Changing the main folder

If you only want to change where files are stored (but keep the same Google account):

1. In Google Drive for the connected Gmail account, create or choose a new folder.
2. Copy the folder’s ID from the URL.
3. Update `GOOGLE_DRIVE_FOLDER_ID` in the `.env` file with the new folder ID.

Newly uploaded files will then go into this new folder. Existing files will remain in the old folder unless you manually move them inside Google Drive.

### 8. Simple example: how it works day-to-day

Here is a typical flow in everyday terms:

1. A coach or admin uploads a player’s document (for example, a signed consent form) through the DHSA Sports system.
2. The app sends that file into the special Google Drive folder linked to the personal Gmail account.
3. The app remembers the file’s Google ID and links it to the right player or record in the database.
4. Later, when staff need to check that document:
   - They open the player’s profile in the sports system.
   - They click the document link.
   - The app quietly fetches the file from Google Drive and shows it, without anyone needing to visit Google Drive manually.

From the user’s point of view, it feels like the files simply “live” in the sports system, even though they are actually stored safely in Google Drive.

---

If you need to hand this over to another person, you can simply:

- Give them access to this document.
- Give them access to the connected Gmail account and/or the main Google Drive folder.

That is usually all they need to understand how documents are stored and how to maintain the connection in the future.

