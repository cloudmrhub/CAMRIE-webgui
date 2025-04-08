# CAMRIE WebGUI

A React + Redux web application for managing jobs and data processing in the CAMRIE system.

## Overview

This project is built using React, Redux Toolkit, and Vite along with Material UI components. It manages user authentication, job submission, and data retrieval. Some key features include:

- **User Authentication:** Login and logout functionality (see [`src/components/Login.tsx`](src/components/Login.tsx) and [`src/store/authSlice.ts`](src/store/authSlice.ts)).
- **Job Submission:** Queue new processing jobs with configurable parameters (see [`src/components/JobForm.tsx`](src/components/JobForm.tsx) and [`src/store/jobSlice.ts`](src/store/jobSlice.ts)).
- **Data & Job Results:** View uploaded files and job statuses (see [`src/components/HomeTab.tsx`](src/components/HomeTab.tsx) and [`src/components/ResultsTab.tsx`](src/components/ResultsTab.tsx)).

## Project Structure

- **Entry Point:** [`src/main.tsx`](src/main.tsx) – Sets up the React app with Redux.
- **Application Component:** [`src/App.tsx`](src/App.tsx) – Manages tab-based routing and authentication.
- **State Management:** 
  - **Authentication:** [`src/store/authSlice.ts`](src/store/authSlice.ts) and [`src/store/authActions.ts`](src/store/authActions.ts).
  - **Job Handling:** [`src/store/jobSlice.ts`](src/store/jobSlice.ts) and [`src/features/jobs/jobActionCreation.ts`](src/features/jobs/jobActionCreation.ts).
  - **Data Management:** [`src/features/data/dataSlice.ts`](src/features/data/dataSlice.ts) and [`src/features/data/dataActionCreation.ts`](src/features/data/dataActionCreation.ts).

## Installation

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd camrie-webgui


## Contributors

Thanks to all our contributors for making this project better!

- [Eros Montin](https://github.com/erosmontin)
- [Susie Nguyen](https://github.com/nguyenxx)
