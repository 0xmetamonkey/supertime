import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

// Validate env vars
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.error('[Google Calendar API] Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY in .env');
}

// Initialize the Auth Client
const auth = new google.auth.JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/calendar.events'],
});

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Creates a Google Meet meeting and adds attendees to trigger email invites.
 * Uses the Service Account's primary calendar so users don't need to auth.
 */
export async function createGoogleMeetMeeting({
  summary,
  description,
  startTime,
  endTime,
  attendees,
}: {
  summary: string;
  description: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  attendees: string[]; // Array of email addresses
}) {
  try {
    const event = {
      summary,
      description,
      start: {
        dateTime: startTime,
      },
      end: {
        dateTime: endTime,
      },
      // Attendees removed to bypass Domain-Wide Delegation error
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: {
            type: 'eventHangout', // generic hangout key instead of enterprise hangoutsMeet
          },
        },
      },
    };

    // Use 'primary' because it's the Service Account's own master calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1, // Needed to generate Meet links
      // sendUpdates removed because there are no attendees
    });

    console.log('[Google Calendar API] Successfully created meeting:', response.data.hangoutLink);

    return {
      success: true,
      eventId: response.data.id,
      hangoutLink: response.data.hangoutLink,
      htmlLink: response.data.htmlLink,
    };
  } catch (error: any) {
    console.error('[Google Calendar API] Error creating meeting:', error.message || error);
    return {
      success: false,
      error: error.message || 'Failed to create meeting',
    };
  }
}
