// Simple test script for Google Drive API
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testGoogleDrive() {
  try {
    console.log('Testing Google Drive API...');
    console.log('Project ID:', process.env.GOOGLE_PROJECT_ID);
    console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('Drive Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    console.log('Private Key Length:', process.env.GOOGLE_PRIVATE_KEY?.length || 0);

    // Process the private key that might have escaped newlines
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '';
    
    // Initialize auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    
    // Test 1: List files in the folder
    console.log('\n--- Test 1: List files in the folder ---');
    try {
      const folderResponse = await drive.files.list({
        q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
        fields: 'files(id, name, mimeType)',
      });
      
      console.log('Files in folder:');
      if (folderResponse.data.files && folderResponse.data.files.length > 0) {
        folderResponse.data.files.forEach(file => {
          console.log(`- ${file.name} (${file.id})`);
        });
      } else {
        console.log('No files found in the folder');
      }
    } catch (error) {
      console.error('Error listing files:', error.message);
    }
    
    // Test 2: Get folder info
    console.log('\n--- Test 2: Get folder info ---');
    try {
      const folderInfo = await drive.files.get({
        fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
        fields: 'id,name,mimeType,capabilities',
      });
      
      console.log('Folder info:');
      console.log(folderInfo.data);
      
      // Check if we can write to this folder
      if (folderInfo.data.capabilities) {
        console.log('\nFolder capabilities:');
        console.log('Can edit:', folderInfo.data.capabilities.canEdit);
        console.log('Can share:', folderInfo.data.capabilities.canShare);
        console.log('Can add children:', folderInfo.data.capabilities.canAddChildren);
      }
    } catch (error) {
      console.error('Error getting folder info:', error.message);
    }
    
    // Test 3: Create a small test file
    console.log('\n--- Test 3: Create a small test file ---');
    try {
      // Create a temporary file
      const tempFilePath = path.join(__dirname, 'test-file.txt');
      fs.writeFileSync(tempFilePath, 'This is a test file for Google Drive API');
      
      const fileMetadata = {
        name: `test-file-${Date.now()}.txt`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };
      
      const media = {
        mimeType: 'text/plain',
        body: fs.createReadStream(tempFilePath),
      };
      
      const fileResponse = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink',
      });
      
      console.log('File created:');
      console.log(fileResponse.data);
      
      // Clean up
      fs.unlinkSync(tempFilePath);
    } catch (error) {
      console.error('Error creating file:', error.message);
      
      if (error.message.includes('Service Accounts do not have storage quota')) {
        console.log('\n--- SOLUTION ---');
        console.log('The service account does not have storage quota. You need to:');
        console.log('1. Create a shared drive in Google Drive');
        console.log('2. Share the drive with the service account email');
        console.log('3. Use the shared drive ID instead of a folder ID');
        console.log('OR');
        console.log('1. Use OAuth authentication instead of service account');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGoogleDrive();
