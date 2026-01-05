TechChrono

TechChrono is a web application where students can explore and register for technical events, and organizers can create and manage events easily.

Built with:

Node.js + Express (backend API)

HTML, CSS, JavaScript (and React where needed)

MySQL (or compatible DB) for persistent storage

Features
Student Features

Create an account and log in

Browse all events

View event details

Register for events

Track events they have registered for

Manage their profile

Organizer Features

Create new events

View all created events

Edit or delete events

Monitor registrations

Project Structure
techchrono/
│
├── node_modules/
├── public/
│   ├── scripts/                 # JavaScript logic
│   ├── styles/                  # CSS files
│   ├── create-event.html        # Create new event page
│   ├── dashboard.html           # Organizer dashboard
│   ├── explore.html             # Browse events
│   ├── index.html               # Landing / home page
│   ├── login.html               # Login form
│   ├── my-events.html           # Events created by organizer
│   ├── profile.html             # User profile page
│   ├── registered-events.html   # Events a student registered for
│   └── signup.html              # Signup form
│
├── uploads/                     # Uploaded images/files
├── server/                      # Backend API (routes, controllers, etc.)
├── techchrono_db/               # Database SQL scripts / backups
├── package.json
├── package-lock.json
└── README.md