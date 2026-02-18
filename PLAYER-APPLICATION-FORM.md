## Player Application Form – Structure

### 1. Basic Identity
- **Full Name** (required)  
- **Date of Birth** (required)  
- **Playing Category / Age Bracket** (derived, read-only)  
  - Logic:  
    - \< 13 years → `U13`  
    - 13–14 years → `U15`  
    - 15–17 years → `U18`  
    - 18+ years → `Senior`  
- **Gender** (required)  
  - Values: `MALE`, `FEMALE`, `OTHER`  
- **Nationality** (required)  
  - Values (current): `INDIAN`, `OTHER`

### 2. Player Contact
- **Mobile Number** (required)  
  - Prefilled from login `me.phone` when form is opened if blank.  
  - Editable; validated as Indian 10-digit phone (starts with 6–9).  
- **Email** (optional)

### 3. Football Basics
- **Sport you want to apply for** (required)  
  - Values: `FOOTBALL`, `CRICKET`, `BASKETBALL`, `OTHER`  
  - When `FOOTBALL` is selected, the position / dominant foot / height / weight fields below are shown; for other sports the Football-specific fields are hidden.  
- **Primary Position** (multi-select via checkboxes)  
  - Values: `GOALKEEPER`, `DEFENDER`, `MIDFIELDER`, `FORWARD`  
  - Stored as JSON string in `PlayerApplication.primaryPosition`.  
- **Dominant Foot** (single-select, required)  
  - Values: `RIGHT`, `LEFT`, `BOTH`  
- **Height (cm)** (optional, integer)  
- **Weight (kg)** (optional, integer)

### 4. Location & Preferences
- **City** (optional)  
- **District** (optional – used in player profile)  
- **Pincode** (required)  
  - 6 numeric digits; validated on frontend and backend.  
- **State** (optional)  
- **Preferred Team(s)** (required, multi-select dropdown with search)  
  - Data source: `GET /api/teams/active` → `{ id, teamId, name, location, status }`  
  - UI:  
    - Text input for client-side search (filters teams by name).  
    - `<select multiple>` bound to `preferredTeamIds: string[]`.  
  - Stored in `PlayerApplication.preferredTeamIds` as JSON string.

### 5. Emergency Contacts (Repeater)
Stored as:
- Legacy primary fields on application:  
  - `emergencyContactName`, `emergencyContactPhone`, `emergencyContactRelation`  
- Full list in `emergencyContactsJson` (JSON array of `{ name, phone, relation }`).

UI:
- At least **one contact row** is always present.  
- Each contact row has:
  - **Contact Name** (first row required)  
  - **Phone** (first row required)  
  - **Relationship** (optional)  
- Actions:
  - **+ Add Contact** → appends `{ name: '', phone: '', relation: '' }`  
  - **Remove** (for rows after the first).

### 6. Documents Upload

#### 6.1 Core Documents
- **Identity Proof (Required) – `ID_PROOF`**  
  - File input (`.pdf,image/*`) + local **View** button.  
  - On save/submit: uploaded via `POST /api/documents/upload` with:  
    - `ownerType = PLAYER_APPLICATION`  
    - `documentType = 'ID_PROOF'`  
    - `notes` empty.  
  - Backend enforces: at least one `ID_PROOF` for the application before submit.

- **Age Proof (Optional) – `DOB_PROOF`**  
  - File input + View.  
  - Uploaded with `documentType = 'DOB_PROOF'` if selected.

- **Passport Photo (Optional) – `PHOTO`**  
  - File input + View.  
  - Uploaded with `documentType = 'PHOTO'` if selected.

#### 6.2 Additional Documents (Repeater)
Model extension:
- `Document.notes` (TEXT) – optional description.

UI for each extra document:
- **Document Type** (dropdown)  
  - Values: `ID_CARD`, `ADDRESS_PROOF`, `MEDICAL_CERTIFICATE`, `SCHOOL_CERTIFICATE`, `OTHER`.  
- **Notes** (free text, stored in `Document.notes`).  
- **File** (`.pdf,image/*`) + local **View**.

Actions:
- **+ Add Document** → creates row `{ id, file: null, type: '', notes: '' }`.  
- **Remove** → deletes that row (front-end state).

On save/submit:
- For each row where both **file** and **type** exist:  
  - Upload via `/api/documents/upload` with:  
    - `ownerType = PLAYER_APPLICATION`  
    - `documentType = <selected type>`  
    - `notes = <notes text>`  
- All documents (core + additional) can be viewed later via:  
  - Player’s **Documents** module (uses `GET /api/documents/my-documents` / `GET /api/player/documents`).  
  - Admin review screens, which aggregate documents by `ownerType/ownerId`.

#### 6.3 In-form Document Preview
- Local files (before upload):  
  - Uses `URL.createObjectURL(file)` and opens in a **popup modal**.  
  - Images rendered with `<img>`, others with `<iframe>`.
- Uploaded documents list (after save/submit):  
  - For each document from backend (`fileUrl`, `mimeType`, `fileName`, `documentType`, `verificationStatus`):  
    - **View** button calls `GET /api/documents/:id` and opens the file URL in the same preview modal.

### 7. Declarations & Consent
Three required checkboxes (all must be checked before submit):

1. **Accuracy**  
   - Text: `I confirm the above information is accurate.`  
2. **Medical fitness**  
   - Text: `I confirm that I am medically fit to participate in football activities.`  
3. **Profile creation consent**  
   - Text: `I consent to the creation of a player profile if my application is approved.`  

State:
- `declarationAccepted`, `declarationMedicallyFit`, `declarationConsentProfile` (booleans).

Validation (frontend + backend):
- Frontend blocks submit if any is `false`.  
- Backend additionally enforces field completeness and documents (see `submitApplication` in `application.controller.ts`).

### 8. Actions & Flow

#### Save Draft
- Endpoint: `POST /api/application/create`.  
- Validates minimal required fields for a draft:  
  - `fullName`, `dateOfBirth`, `gender`, `playerPhone`, primary emergency contact name/phone.  
- Saves application as `DRAFT`.  
- Uploads any selected documents (core + additional).

#### Submit Application
- Endpoint: `POST /api/application/submit`.  
- Preconditions:
  - Application exists and is `DRAFT`.  
  - All three declarations checked.  
  - Required fields completed: identity, contact, nationality, district/pincode, preferred teams, emergency contact, etc.  
  - Pincode valid (6 digits).  
  - At least one `ID_PROOF` document exists in DB for this application.  
- Flow:
  1. Re-saves latest form data via `/api/application/create`.  
  2. Uploads any pending documents (core + additional).  
  3. Marks application as `SUBMITTED`, creates a `Trial`, and links it.  

