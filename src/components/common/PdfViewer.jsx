import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowRotateRight,
  FaDownload,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
  FaUpRightFromSquare,
} from "react-icons/fa6";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Vite bundles the PDF.js worker as a separate asset for react-pdf previews.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PdfViewer({
  title,
  viewerUrl,
  loading,
  emptyMessage,
  onDownload,
  onReload,
  downloadDisabled = false,
}) {
  const containerRef = useRef(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(720);
  const [scale, setScale] = useState(1);
  const [pdfError, setPdfError] = useState("");

  useEffect(() => {
    setPageCount(0);
    setPageNumber(1);
    setPdfError("");
  }, [viewerUrl]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      setViewerWidth(Math.min(Math.max(element.clientWidth - 32, 280), 980));
    };
    const resizeObserver = new ResizeObserver(updateWidth);

    updateWidth();
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  const handleOpenInDeviceViewer = () => {
    if (!viewerUrl) return;

    window.open(viewerUrl, "_blank", "noopener,noreferrer");
  };

  const handleLoadSuccess = ({ numPages }) => {
    setPageCount(numPages);
    setPageNumber(1);
    setPdfError("");
  };

  const handleLoadError = () => {
    setPdfError("Unable to render this PDF preview. Open or download the file instead.");
  };

  const goToPreviousPage = () => {
    setPageNumber((currentPage) => Math.max(currentPage - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((currentPage) => Math.min(currentPage + 1, pageCount || 1));
  };

  const zoomOut = () => {
    setScale((currentScale) => Math.max(Number((currentScale - 0.15).toFixed(2)), 0.75));
  };

  const zoomIn = () => {
    setScale((currentScale) => Math.min(Number((currentScale + 0.15).toFixed(2)), 1.6));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/5">
      <div className="flex flex-col gap-3 border-b border-primary/10 bg-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-primary">{title}</p>
          {viewerUrl && pageCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-primary/55">
              Page {pageNumber} of {pageCount}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {viewerUrl && (
            <>
              <button
                type="button"
                onClick={goToPreviousPage}
                disabled={pageNumber <= 1}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                title="Previous page"
              >
                <FaArrowLeft />
                Prev
              </button>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={!pageCount || pageNumber >= pageCount}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                title="Next page"
              >
                Next
                <FaArrowRight />
              </button>
              <button
                type="button"
                onClick={zoomOut}
                disabled={scale <= 0.75}
                className="flex items-center justify-center rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                title="Zoom out"
              >
                <FaMagnifyingGlassMinus />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={scale >= 1.6}
                className="flex items-center justify-center rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
                title="Zoom in"
              >
                <FaMagnifyingGlassPlus />
              </button>
            </>
          )}

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
        <div
          ref={containerRef}
          className="max-h-[80vh] min-h-[600px] overflow-auto bg-white px-4 py-6"
        >
          {pdfError ? (
            <div className="flex min-h-[500px] items-center justify-center px-5 text-center text-primary/70">
              {pdfError}
            </div>
          ) : (
            <Document
              file={viewerUrl}
              loading={
                <div className="flex min-h-[500px] items-center justify-center text-primary/70">
                  Preparing PDF preview...
                </div>
              }
              error={
                <div className="flex min-h-[500px] items-center justify-center px-5 text-center text-primary/70">
                  Unable to render this PDF preview. Open or download the file instead.
                </div>
              }
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                width={viewerWidth}
                scale={scale}
                renderAnnotationLayer
                renderTextLayer
                className="overflow-hidden rounded-xl shadow-2xl"
              />
            </Document>
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
