# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-11-15

### Added
- Test accounts and sample data documentation in `docs/test-data.md`, linked from the README.

### Changed
- README: the demo users section now lists the accounts loaded in the published Azure environment.

## [1.0.0] - 2026-11-15

### Added
- IAM bounded context: sign-in, company registration with an optional plan and simulated payment, password recovery, employee management, and profile and password updates, with role-based route guards for `sysadmin`, `technician`, `admin`, `company_manager`, and `employee`.
- Equipment bounded context: company locations and devices, with filters, assignment to employees, and the history of each device.
- Subscriptions bounded context: company dashboard, plan subscription and renewal, support-hour balance, and preventive maintenance scheduling.
- Service Requests bounded context: issue reporting for employees, ticket assignment for UniLink support, and the diagnosis and resolution workflow for technicians.
- Quotations bounded context: quotation history, approval or rejection, and simulated payment receipts.
- English and Spanish user interface with Vue I18n; the selected language is also sent to the API so its error messages match.
- Integration with the CompuCare Platform REST API through Axios, with JWT bearer authentication.
- Deployment as an Azure Static Web App: production API base URL in `.env.production` and an SPA navigation fallback in `public/staticwebapp.config.json`.
