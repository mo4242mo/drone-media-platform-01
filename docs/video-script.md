# CW2 Video Demo Script (5 Minutes)

This guide helps you prepare your 5-minute demonstration video for CW2 submission.

## Video Requirements Recap

- **Maximum Length**: 5 minutes
- **Penalties**:
  - > 30 sec over: 10% deduction
  - > 1 min over: 20% deduction
- **Camera**: Should appear in video (face cam) if possible
- **Content**: Demonstrate CRUD operations, Azure resources, advanced features

## Suggested Timeline

| Time | Section | Duration |
|------|---------|----------|
| 0:00 - 0:30 | Introduction | 30 sec |
| 0:30 - 1:30 | Running Application Demo | 60 sec |
| 1:30 - 3:00 | CRUD Operations | 90 sec |
| 3:00 - 4:00 | Azure Resources Walkthrough | 60 sec |
| 4:00 - 4:45 | Advanced Features & CI/CD | 45 sec |
| 4:45 - 5:00 | Conclusion | 15 sec |

## Detailed Script

### 1. Introduction (0:00 - 0:30)

"Hello, I'm [Your Name], student number [Your Number]. Today I'll demonstrate my Drone Media Platform - a cloud-native web application built on Microsoft Azure for managing drone media with rich geospatial metadata."

### 2. Running Application (0:30 - 1:30)

**Show the live website:**

"Here's my deployed application running on Azure Static Web Apps."

**Demonstrate:**
- Navigate to the gallery page
- Show the responsive design
- Point out the search and filter features
- Click on a media item to show the detail modal

"The frontend is hosted on Azure Static Web Apps with automatic HTTPS and global CDN distribution."

### 3. CRUD Operations (1:30 - 3:00)

**CREATE - Upload new media:**

"Let me upload a new drone image. I'll drag and drop a file..."
- Show the upload form
- Fill in title and metadata
- Add GPS coordinates
- Submit and show success message

**READ - View uploaded media:**

"Now let's view the uploaded media in the gallery..."
- Show the new item in the grid
- Click to see full details
- Show metadata display

**UPDATE - Edit metadata:**

"I can edit the metadata..."
- Click edit button
- Change title/description
- Save and show updated info

**DELETE - Remove media:**

"And delete media when needed..."
- Click delete button
- Confirm deletion
- Show item removed from gallery

### 4. Azure Resources (3:00 - 4:00)

**Switch to Azure Portal:**

"Let me show you the Azure resources powering this application."

**Show each resource:**

1. **Resource Group** (`drone-media-rg`)
   - "All resources organized in a single resource group"

2. **Azure Static Web Apps** 
   - "Frontend hosting with built-in CI/CD"

3. **Azure Functions**
   - "Serverless API endpoints for CRUD operations"
   - Show the function list briefly

4. **Azure Blob Storage**
   - "Media files stored here"
   - Show the container with uploaded files

5. **Azure Cosmos DB**
   - "NoSQL database for metadata"
   - Show Data Explorer with documents

### 5. Advanced Features & CI/CD (4:00 - 4:45)

**Application Insights:**
- "I've integrated Application Insights for monitoring"
- Show Live Metrics or Performance tab briefly

**Cognitive Services (if implemented):**
- "AI-powered image analysis using Computer Vision"
- Show analyze endpoint or results

**CI/CD Pipeline:**
- "GitHub Actions handles deployment automatically"
- Show GitHub Actions tab with recent deployments
- "Every push to main triggers deployment"

### 6. Conclusion (4:45 - 5:00)

"To summarize, I've built a fully functional cloud-native drone media platform using:
- Azure Static Web Apps for frontend
- Azure Functions for serverless API
- Cosmos DB and Blob Storage for data
- Application Insights for monitoring

Thank you for watching."

## Recording Tips

### Before Recording
- [ ] Test all features work correctly
- [ ] Clear browser history/cache for clean demo
- [ ] Have sample media files ready
- [ ] Close unnecessary browser tabs
- [ ] Disable notifications

### During Recording
- [ ] Speak clearly and at moderate pace
- [ ] Keep mouse movements smooth and deliberate
- [ ] Pause briefly when showing important elements
- [ ] Don't rush - stay within 5 minutes

### Technical Setup
- Use Panopto Capture (recommended) or Screencast-O-Matic
- Screen resolution: 1920x1080 recommended
- Audio: Use headset/microphone for clear sound
- Camera: Enable if possible

### Post-Recording
- [ ] Review the video for quality
- [ ] Check audio levels
- [ ] Verify timing (under 5 minutes)
- [ ] Submit via Blackboard Panopto assignment

## Things NOT to Include

- ❌ CW1 slides or presentation
- ❌ Code walkthrough (unless specifically relevant)
- ❌ Lengthy explanations of concepts
- ❌ Azure account login credentials
- ❌ Background music or effects

## Quick Checklist for Video

### Must Show
- [ ] Running application (frontend)
- [ ] Upload media (CREATE)
- [ ] View media list and details (READ)
- [ ] Edit media metadata (UPDATE)
- [ ] Delete media (DELETE)
- [ ] Azure Portal resources
- [ ] CI/CD deployment evidence
- [ ] At least one advanced feature

### Must Mention
- [ ] Azure services used
- [ ] Your name and student number
- [ ] What advanced features you implemented
- [ ] Note if any features aren't working

Good luck with your submission!

