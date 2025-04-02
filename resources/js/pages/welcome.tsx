import React from 'react';
import { Link } from '@inertiajs/react'; // Import Link from Inertia React
import './Welcome.css'; // Import the CSS for styling

const Welcome = () => {
  return (
    <div className="welcome-page"> {/* A top-level container for the entire page */}
      {/* Navbar Section */}
      <header className="welcome-header">
        <nav className="navbar">
          <div className="navbar-title">National Medical Library Management System</div>
          <div className="navbar-links">
            {/* Use Inertia Link for routing */}
            <Link href={route('register')}>Register</Link>
            <Link href={route('login')}>Login</Link>
          </div>
        </nav>
      </header>

      {/* Main Content Section */}
      <main className="welcome-main">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>Welcome to the National Medical Library</h1>
            <p>Your comprehensive resource for medical knowledge and research.</p>
            <button className="hero-button">Explore the Library</button>
          </div>
        </section>

        {/* Advantages Section */}
        <section className="advantages">
          <h2>Advantages of our Library Management System</h2>
          <div className="advantages-cards">
            <div className="advantage-card">
              <h3>Easy Access to Resources</h3>
              <p>Find the medical information you need quickly and efficiently.</p>
            </div>
            <div className="advantage-card">
              <h3>Streamlined Borrowing</h3>
              <p>Borrow and return books and materials with ease.</p>
            </div>
            <div className="advantage-card">
              <h3>Stay Updated</h3>
              <p>Access the latest medical research and publications.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <h2>Key Features</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <h3>Borrow Now</h3>
              <p>Quickly borrow available medical resources.</p>
              <button className="feature-button">Borrow Now</button>
            </div>
            <div className="feature-card">
              <h3>Search Book</h3>
              <p>Find specific medical books and publications.</p>
              <input type="text" placeholder="Search for a book..." />
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="welcome-footer">
        <p>&copy; 2025 National Medical Library Management System</p>
      </footer>
    </div>
  );
};

export default Welcome;