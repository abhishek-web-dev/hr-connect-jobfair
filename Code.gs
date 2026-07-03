/**
 * Google Apps Script (Code.gs) for CareerConnect Portal
 * 
 * Stores Job Fair registration details directly into Google Sheets.
 * Uploads optional resumes to Google Drive and links their URLs.
 * 
 * Google Sheet URL:
 * https://docs.google.com/spreadsheets/d/1jqRImi6XHPrldUmR_V3jTB5rXeaxlKZc2lw3JQv-Yv0/edit
 */

function doPost(e) {
  try {
    // Open the Google Sheet using the exact Spreadsheet ID provided
    var doc = SpreadsheetApp.openById("1jqRImi6XHPrldUmR_V3jTB5rXeaxlKZc2lw3JQv-Yv0");
    var sheet = doc.getActiveSheet();
    
    var data = e.parameter;
    
    // Setup header row if the sheet is completely empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Full Name",
        "Mobile Number",
        "Email",
        "Qualification",
        "College Name",
        "Branch",
        "Semester",
        "Graduation Year",
        "City",
        "Experience",
        "Experience Details",
        "Skills",
        "Interested Role",
        "Resume File Name"
      ]);
    }
    
    var resumeUrl = "";
    
    // Process Resume File Upload to Google Drive if it exists
    if (data.resumeFile && data.resumeName) {
      try {
        var fileData = data.resumeFile;
        // Strip out base64 visual header descriptors
        var base64Data = fileData.substring(fileData.indexOf(";base64,") + 8);
        var contentType = fileData.substring(5, fileData.indexOf(";base64,"));
        var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, data.resumeName);
        
        // Save file directly inside Google Drive Root folder
        var folder = DriveApp.getRootFolder();
        var file = folder.createFile(blob);
        
        // Set file permissions to make it viewable by anyone with the link (critical for HR access)
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        resumeUrl = file.getUrl();
      } catch (err) {
        resumeUrl = "Upload failed: " + err.message;
      }
    }
    
    // Write new registration row to sheet
    sheet.appendRow([
      new Date(),                 // Timestamp
      data.fullName,              // Full Name
      data.mobile,                // Mobile Number
      data.email,                 // Email
      data.qualification,         // Qualification
      data.collegeName,           // College Name
      data.branch,                // Branch
      data.semester,              // Semester
      data.graduationYear,        // Graduation Year
      data.city || "",            // City (optional)
      data.experience,            // Experience
      data.experienceDetails || "", // Experience Details (optional)
      data.skills || "",          // Skills (optional)
      data.interestedRole,        // Interested Role
      resumeUrl                   // Resume File Name (Saved as Drive view URL link)
    ]);
    
    // Return standard success response
    return ContentService.createTextOutput(JSON.stringify({ result: "success", resumeUrl: resumeUrl }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
