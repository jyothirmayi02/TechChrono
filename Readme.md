# TechChrono

TechChrono is a web application where students can explore and register for technical events, and organizers can create and manage events easily.

# Built with:

Node.js + Express (backend API)<br>
HTML, CSS, JavaScript (and React where needed)<br>
MySQL (or compatible DB) for persistent storage

# Features

Create an account and log in<br>
Browse all events<br>
View event details<br>
Register for events<br>
Track events they have registered for<br>
Manage their profile<br>
Create new events<br>
View all created events<br>
Edit or delete events<br>
Monitor registrations<br>

# Project Structure
```text
techchrono/<br>
│<br>
├── node_modules/<br>
├── public/<br>
│   ├── scripts/                 # JavaScript logic<br>
│   ├── styles/                  # CSS files<br>
│   ├── create-event.html        # Create new event page<br>
│   ├── dashboard.html           # Organizer dashboard<br>
│   ├── explore.html             # Browse events<br>
│   ├── index.html               # Landing / home page<br>
│   ├── login.html               # Login form<br>
│   ├── my-events.html           # Events created by organizer<br>
│   ├── profile.html             # User profile page<br>
│   ├── registered-events.html   # Events a student registered for<br>
│   └── signup.html              # Signup form<br>
│<br>
├── uploads/                     # Uploaded images/files<br>
├── server/                      # Backend API (routes, controllers, etc.)<br>
├── techchrono_db/               # Database SQL scripts / backups<br>
├── package.json<br>
├── package-lock.json<br>
└── README.md