import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PdfViewer from "../../components/common/PdfViewer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function StudentResult() {
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("");

  const [viewerUrl, setViewerUrl] = useState("");

  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingViewer, setLoadingViewer] = useState(false);

  const [error, setError] = useState("");

  const viewerRef = useRef(null);

  /* ==========================================
     GET SELECTED RESULT
  ========================================== */
  const selectedResult = useMemo(() => {
    return results.find(
      (result) => result._id === selectedResultId
    );
  }, [results, selectedResultId]);

  /* ==========================================
     BUILD DOWNLOAD FILE NAME
  ========================================== */
  const buildResultFileName = (result) => {
    if (!result) return "result.pdf";

    const studentName =
      user?.full_name || "student";

    return (
      result.file_name ||
      `${studentName}-${result.term}-${result.session}-result.pdf`
    )
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  /* ==========================================
     FETCH STUDENT RESULTS
  ========================================== */
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        setError("");

        const response = await API.get(
          `/results/student/${user.id}`
        );

        const resultList = response.data || [];

        setResults(resultList);

        if (resultList.length > 0) {
          setSelectedResultId(resultList[0]._id);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load your results."
        );
      } finally {
        setLoadingResults(false);
      }
    };

    if (user?.id) {
      fetchResults();
    }
  }, [user?.id]);

  /* ==========================================
     LOAD PDF AUTOMATICALLY
     WHEN RESULT CHANGES
  ========================================== */
  const loadPdf = useCallback(async () => {
    if (!selectedResultId) return;

    try {
      setLoadingViewer(true);
      setError("");

      const response = await API.get(
          `/results/${selectedResultId}/view`,
          {
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(response.data);

      setViewerUrl((oldUrl) => {
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl);
        }

        return objectUrl;
      });

      setTimeout(() => {
        viewerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load PDF."
      );
    } finally {
      setLoadingViewer(false);
    }
  }, [selectedResultId]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  /* ==========================================
     CLEANUP OBJECT URL
  ========================================== */
  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  /* ==========================================
     SELECT RESULT
  ========================================== */
  const handleResultSelect = (resultId) => {
    setSelectedResultId(resultId);
  };

  /* ==========================================
     DOWNLOAD RESULT
  ========================================== */
  const handleDownload = async () => {
    if (!selectedResult) return;

    try {
      setError("");

      const response = await API.get(
        `/results/${selectedResult._id}/download`,
        {
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(
        response.data
      );

      const link =
        document.createElement("a");

      link.href = objectUrl;
      link.download =
        buildResultFileName(selectedResult);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to download this result."
      );
    }
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      {/* ==========================
          HEADER
      ========================== */}
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaFilePdf />
        </div>

        <h2 className="text-3xl font-extrabold text-secondary">
          My Results
        </h2>

        <p className="mt-3 max-w-2xl text-secondary/75">
          Select a result to preview it instantly.
          You can also download a copy to your
          device.
        </p>
      </div>

      {/* ==========================
          ERROR
      ========================== */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* ==========================
            RESULT LIST
        ========================== */}
        <aside className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary">
            Result Records
          </h3>

          <p className="mt-3 text-primary/70">
            Select a result to view.
          </p>

          <div className="mt-7 space-y-4">
            {loadingResults ? (
              <div className="rounded-lg bg-primary/5 p-5 text-primary/70">
                Loading results...
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-lg bg-primary/5 p-5 text-primary/70">
                No result has been uploaded yet.
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result._id}
                  onClick={() =>
                    handleResultSelect(
                      result._id
                    )
                  }
                  className={`w-full rounded-lg border p-5 text-left transition-all duration-300 ${
                    selectedResultId ===
                    result._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold">
                    {result.term}
                  </p>

                  <p className="mt-2 text-sm opacity-80">
                    {result.session} •{" "}
                    {result.class}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ==========================
            PDF VIEWER
        ========================== */}
        <section
          ref={viewerRef}
          className="rounded-lg bg-secondary p-6 shadow-lg lg:p-8"
        >
          <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Result Viewer
              </h3>

              <p className="mt-2 text-primary/70">
                {selectedResult
                  ? `${selectedResult.term} • ${selectedResult.session}`
                  : "Select a result to continue"}
              </p>
            </div>

            <div className="hidden md:block"></div>
          </div>

            <PdfViewer
            title="Student Result PDF"
            viewerUrl={viewerUrl}
            loading={loadingViewer}
            emptyMessage="Select a result to view."
            onDownload={handleDownload}
            onReload={loadPdf}
            downloadDisabled={!selectedResult}
          />
        </section>
      </div>
    </div>
  );
}

export default StudentResult;

