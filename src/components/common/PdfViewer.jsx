import { FaArrowRotateRight, FaDownload, FaUpRightFromSquare } from "react-icons/fa6";

function PdfViewer({
  title,
  viewerUrl,
  loading,
  emptyMessage,
  onDownload,
  onReload,
  downloadDisabled = false,
}) {
  const handleOpenInDeviceViewer = () => {
    if (!viewerUrl) return;

    window.open(viewerUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/5">
      <div className="flex flex-col gap-3 border-b border-primary/10 bg-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-bold text-primary">{title}</p>

        <div className="flex flex-wrap gap-2">
          {onReload && (
            <button
              type="button"
              onClick={onReload}
              disabled={!viewerUrl && !loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
              title="Reload PDF"
            >
              <FaArrowRotateRight />
              Reload
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenInDeviceViewer}
            disabled={!viewerUrl}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
            title="Open in device PDF viewer"
          >
            <FaUpRightFromSquare />
            Open
          </button>

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={downloadDisabled}
              className="flex items-center justify-center gap-2 rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              title="Download PDF"
            >
              <FaDownload />
              Download
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[500px] items-center justify-center text-primary/70">
          Loading PDF...
        </div>
      ) : viewerUrl ? (
        <div className="bg-white">
          <object
            data={`${viewerUrl}#toolbar=1&navpanes=0`}
            type="application/pdf"
            className="h-[75vh] min-h-[600px] w-full"
          >
            <iframe
              title={title}
              src={`${viewerUrl}#toolbar=1&navpanes=0`}
              className="h-[75vh] min-h-[600px] w-full"
              loading="lazy"
            />
          </object>
        </div>
      ) : (
        <div className="flex min-h-[500px] items-center justify-center px-5 text-center text-primary/70">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export default PdfViewer;
