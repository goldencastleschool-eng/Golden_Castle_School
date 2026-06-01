import { useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaFilePdf, FaUpRightFromSquare } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function StudentResult() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("");
  const [viewerResultId, setViewerResultId] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState("");
  const viewerRef = useRef(null);

  const buildResultFileName = (result) => {
    const studentName = user?.full_name || "student";
    const fileName =
      result.file_name || `${studentName}-${result.term}-${result.session}-result.pdf`;

    return fileName
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
        const response = await API.get(`/results/student/${user.id}`);
        const resultList = response.data || [];
        setResults(resultList);
        setSelectedResultId(resultList[0]?._id || "");
        setViewerResultId("");
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
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

  const selectedResult = useMemo(
    () => results.find((result) => result._id === selectedResultId),
    [results, selectedResultId]
  );

  const viewerResult = useMemo(
    () => results.find((result) => result._id === viewerResultId),
    [results, viewerResultId]
  );

  const handleResultSelect = (resultId) => {
    setSelectedResultId(resultId);
    setViewerResultId("");
    setViewerUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });
  };

  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  const handleOpenViewer = async () => {
    if (!selectedResult) {
      return;
    }

    try {
      setLoadingViewer(true);
      setError("");
      const response = await API.get(`/results/${selectedResult._id}/view`, {
        responseType: "blob",
      });
      const objectUrl = URL.createObjectURL(response.data);

      setViewerUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return objectUrl;
      });
      setViewerResultId(selectedResult._id);
      window.setTimeout(() => {
        viewerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    } catch (viewerError) {
      setError(
        viewerError.response?.data?.message ||
          "Unable to open this result in the PDF viewer."
      );
    } finally {
      setLoadingViewer(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedResult) {
      return;
    }

    const fileName = buildResultFileName(selectedResult);

    try {
      setError("");
      const response = await API.get(
        `/results/${selectedResult._id}/download`,
        {
          responseType: "blob",
        }
      );
      const blob = response.data;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      setError(
        downloadError.response?.data?.message ||
          "Unable to download this result. Please make sure the backend is running and try again."
      );
    }
  };

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaFilePdf />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">My Results</h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          Choose a result, open it in the browser PDF viewer, or download it to
          your local machine.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Result Records
          </h3>
          <p className="mt-3 text-primary/70">
            Select a result, then use Open or Download.
          </p>

          <div className="mt-7 space-y-4">
            {loadingResults ? (
              <div className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                Loading results...
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                No result has been uploaded yet.
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => handleResultSelect(result._id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                    selectedResultId === result._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold">{result.term}</p>
                  <p className="mt-2 text-sm opacity-80">
                    {result.session} - {result.class}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section
          ref={viewerRef}
          className="rounded-[2rem] bg-secondary p-6 shadow-2xl lg:p-8"
        >
          <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                PDF Viewer
              </h3>
              <p className="mt-2 text-primary/70">
                {selectedResult
                  ? `${selectedResult.term} - ${selectedResult.session}`
                  : "Select a result to continue."}
              </p>
            </div>

            {selectedResult && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleOpenViewer}
                  disabled={loadingViewer}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary/10 px-5 py-3 font-bold text-primary transition duration-300 hover:bg-primary hover:text-secondary"
                >
                  <FaUpRightFromSquare />
                  {loadingViewer ? "Opening..." : "Open"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-button px-5 py-3 font-bold text-secondary shadow-lg transition duration-300 hover:scale-105"
                >
                  <FaDownload />
                  Download
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-primary/5">
            {viewerResult && viewerUrl ? (
              <iframe
                title={`${viewerResult.term} result PDF`}
                src={viewerUrl}
                className="h-[70vh] min-h-[520px] w-full bg-white"
              />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-primary/70">
                {loadingResults
                  ? "Loading result records..."
                  : loadingViewer
                    ? "Opening PDF viewer..."
                    : selectedResult
                    ? "Click Open to load this PDF in the viewer."
                    : "Select a result record to continue."}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default StudentResult;
