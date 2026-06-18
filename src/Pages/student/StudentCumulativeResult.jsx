import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PdfViewer from "../../components/common/PdfViewer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function StudentCumulativeResult() {
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [error, setError] = useState("");

  const viewerRef = useRef(null);

  const selectedResult = useMemo(() => {
    return results.find((result) => result._id === selectedResultId);
  }, [results, selectedResultId]);

  const buildResultFileName = (result) => {
    if (!result) return "cumulative-result.pdf";

    const studentName = user?.full_name || "student";

    return (
      result.file_name ||
      `${studentName}-${result.session}-cumulative-result.pdf`
    )
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        setError("");

        const response = await API.get(
          `/cumulative-results/student/${user.id}`
        );

        const resultList = response.data || [];

        setResults(resultList);

        if (resultList.length > 0) {
          setSelectedResultId(resultList[0]._id);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setResults([]);
          setSelectedResultId("");
          setViewerUrl((oldUrl) => {
            if (oldUrl) {
              URL.revokeObjectURL(oldUrl);
            }

            return "";
          });
          return;
        }

        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to load your cumulative results."
        );
      } finally {
        setLoadingResults(false);
      }
    };

    if (user?.id) {
      fetchResults();
    }
  }, [user?.id]);

  const loadPdf = useCallback(async () => {
    if (!selectedResultId) return;

    try {
      setLoadingViewer(true);
      setError("");

      const response = await API.get(
        `/cumulative-results/${selectedResultId}/view`,
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
          "Unable to load cumulative result PDF."
      );
    } finally {
      setLoadingViewer(false);
    }
  }, [selectedResultId]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  const handleDownload = async () => {
    if (!selectedResult) return;

    try {
      setError("");

      const response = await API.get(
        `/cumulative-results/${selectedResult._id}/download`,
        {
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = buildResultFileName(selectedResult);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to download this cumulative result."
      );
    }
  };

  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-button text-xl text-secondary">
          <FaFilePdf />
        </div>

        <h2 className="text-3xl font-extrabold text-secondary">
          Cumulative Results
        </h2>

        <p className="mt-3 max-w-2xl text-secondary/75">
          Select a cumulative session result to preview or download the PDF.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <aside className="rounded-lg bg-secondary p-6 shadow-lg">
          <h3 className="text-2xl font-extrabold text-primary">
            Cumulative Records
          </h3>

          <p className="mt-3 text-primary/70">
            Select a session result to view.
          </p>

          <div className="mt-7 space-y-4">
            {loadingResults ? (
              <div className="rounded-lg bg-primary/5 p-5 text-primary/70">
                Loading cumulative results...
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-lg bg-primary/5 p-5 text-primary/70">
                No cumulative result has been uploaded yet.
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => setSelectedResultId(result._id)}
                  className={`w-full rounded-lg border p-5 text-left transition-all duration-300 ${
                    selectedResultId === result._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold">
                    {result.session}
                  </p>

                  <p className="mt-2 text-sm opacity-80">
                    {result.class}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section
          ref={viewerRef}
          className="rounded-lg bg-secondary p-6 shadow-lg lg:p-8"
        >
          <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                Cumulative Result Viewer
              </h3>

              <p className="mt-2 text-primary/70">
                {selectedResult
                  ? `${selectedResult.session} - ${selectedResult.class}`
                  : "Select a cumulative result to continue"}
              </p>
            </div>

            <div className="hidden md:block"></div>
          </div>

          <PdfViewer
            title="Student Cumulative Result PDF"
            viewerUrl={viewerUrl}
            loading={loadingViewer}
            emptyMessage="Select a cumulative result to view."
            onDownload={handleDownload}
            onReload={loadPdf}
            downloadDisabled={!selectedResult}
          />
        </section>
      </div>
    </div>
  );
}

export default StudentCumulativeResult;

