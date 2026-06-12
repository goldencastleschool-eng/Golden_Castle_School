import schoolLogo from "../assets/1723987411228.jpg";

export const SCHOOL_NAME = "Golden Castle International School";

export const getSchoolLogoUrl = () =>
  new URL(schoolLogo, window.location.origin).href;

const escapePrintHtml = (value = "") =>
  value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const getPrintBrandStyles = () => `
  .school-print-brand {
    align-items: center;
    border-bottom: 2px solid #111;
    display: flex;
    gap: 14px;
    margin-bottom: 20px;
    padding-bottom: 14px;
  }

  .school-print-brand img {
    border-radius: 50%;
    height: 58px;
    object-fit: cover;
    width: 58px;
  }

  .school-print-brand h1 {
    color: #111;
    font-size: 22px;
    line-height: 1.1;
    margin: 0;
  }

  .school-print-brand p {
    color: #555;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    margin: 5px 0 0;
    text-transform: uppercase;
  }
`;

export const getPrintBrandHeader = ({ title = "", subtitle = "" } = {}) => `
  <header class="school-print-brand">
    <img src="${escapePrintHtml(getSchoolLogoUrl())}" alt="${SCHOOL_NAME} logo" />
    <div>
      <h1>${SCHOOL_NAME}</h1>
      ${title ? `<p>${escapePrintHtml(title)}</p>` : ""}
      ${subtitle ? `<p>${escapePrintHtml(subtitle)}</p>` : ""}
    </div>
  </header>
`;

export { schoolLogo };
