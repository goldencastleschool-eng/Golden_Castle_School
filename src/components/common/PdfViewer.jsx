import { lazy, Suspense, useMemo } from "react";
import {
  FaArrowRotateRight,
  FaDownload,
  FaUpRightFromSquare,
} from "react-icons/fa6";

const ReactPdfPreview = lazy(() => import("./ReactPdfPreview.jsx"));

function PdfViewer({
  title,
  viewerUrl,
  loading,
  emptyMessage,
  onDownload,
  onReload,
  downloadDisabled = false,
}) {
  const canPreviewInFrame = useMemo(() => {
    if (typeof navigator === "undefined") {
      return true;
    }

    const userAgent = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    return !isIOS;
  }, []);

  const handleOpenInDeviceViewer = () => {
    if (!viewerUrl) return;

    window.open(viewerUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/5">
      <div className="flex flex-col gap-3 border-b border-primary/10 bg-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-primary">{title}</p>
          {viewerUrl && (
            <p className="mt-1 text-xs font-semibold text-primary/55">
              Use Open or Download if your browser cannot show the preview.
            </p>
          )}
        </div>

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
        <div className="min-h-[600px] bg-white">
          {canPreviewInFrame ? (
            <Suspense
              fallback={
                <div className="flex min-h-[500px] items-center justify-center text-primary/70">
                  Preparing PDF preview...
                </div>
              }
            >
              <ReactPdfPreview key={viewerUrl} viewerUrl={viewerUrl} />
            </Suspense>
          ) : (
            <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 px-5 text-center text-primary/70">
              <p className="max-w-md font-semibold">
                This phone's browser opens PDFs more reliably in the device PDF viewer.
              </p>
              <button
                type="button"
                onClick={handleOpenInDeviceViewer}
                className="flex items-center justify-center gap-2 rounded-xl bg-button px-4 py-2 text-sm font-bold text-secondary transition hover:scale-[1.02]"
              >
                <FaUpRightFromSquare />
                Open PDF
              </button>
            </div>
          )}
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
