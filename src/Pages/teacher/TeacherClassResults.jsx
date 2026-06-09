import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PdfViewer from "../../components/common/PdfViewer.jsx";

function TeacherClassResults() {
  const [classResults, setClassResults] = useState([]);
  const [selectedClassResultId, setSelectedClassResultId] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [loadingClassResults, setLoadingClassResults] = useState(true);
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [error, setError] = useState("");
  const viewerRef = useRef(null);

  const selectedClassResult = useMemo(
    () =>
      classResults.find(
        (classResult) => classResult._id === selectedClassResultId
      ),
    [classResults, selectedClassResultId]
  );

  useEffect(() => {
    const fetchClassResults = async () => {
      try {
        setLoadingClassResults(true);
        setError("");

        const response = await API.get("/class-results/teacher");
        const classResultList = response.data || [];

        setClassResults(classResultList);

        if (classResultList.length > 0) {
          setSelectedClassResultId(classResultList[0]._id);
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load your class results."
        );
      } finally {
        setLoadingClassResults(false);
      }
    };

    fetchClassResults();
  }, []);

  const loadPdf = useCallback(async () => {
    if (!selectedClassResultId) {
      return;
    }

    try {
      setLoadingViewer(true);
      setError("");

      const response = await API.get(
        `/class-results/${selectedClassResultId}/view`,
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
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load this class result PDF."
      );
    } finally {
      setLoadingViewer(false);
    }
  }, [selectedClassResultId]);

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
    if (!selectedClassResult) {
      return;
    }

    try {
      setError("");

      const response = await API.get(
        `/class-results/${selectedClassResult._id}/download`,
        {
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download =
        selectedClassResult.file_name ||
        `${selectedClassResult.class}-${selectedClassResult.term}-${selectedClassResult.session}-class-result.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to download this class result."
      );
    }
  };

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-button text-xl text-secondary">
          <FaFilePdf />
        </div>
        <h2 className="text-4xl font-extrabold text-secondary">
          Class Results
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          View and download the class result currently approved by admin.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <aside className="rounded-[2rem] bg-secondary p-8 shadow-2xl">
          <h3 className="text-2xl font-extrabold text-primary">
            Approved Class Results
          </h3>
          <p className="mt-2 text-primary/70">
            Only class results opened by admin appear here.
          </p>

          <div className="mt-6 space-y-3">
            {loadingClassResults ? (
              <p className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                Loading class results...
              </p>
            ) : classResults.length === 0 ? (
              <p className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                No class result is currently available.
              </p>
            ) : (
              classResults.map((classResult) => (
                <button
                  key={classResult._id}
                  type="button"
                  onClick={() => setSelectedClassResultId(classResult._id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                    selectedClassResultId === classResult._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold uppercase">
                    {classResult.class}
                  </p>
                  <p className="mt-1 text-sm opacity-75">
                    {classResult.session} - {classResult.term}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <section
          ref={viewerRef}
          className="rounded-[2rem] bg-secondary p-8 shadow-2xl"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-3xl font-extrabold text-primary">
                {selectedClassResult
                  ? `${selectedClassResult.class.toUpperCase()} Class Result`
                  : "Class Result Preview"}
              </h3>
              <p className="mt-2 text-primary/70">
                {selectedClassResult
                  ? `${selectedClassResult.session} - ${selectedClassResult.term}`
                  : "Select a class result to preview."}
              </p>
            </div>

            <div className="hidden md:block"></div>
          </div>

          <PdfViewer
            title="Class Result PDF"
            viewerUrl={viewerUrl}
            loading={loadingViewer}
            emptyMessage="No class result selected."
            onDownload={handleDownload}
            onReload={loadPdf}
            downloadDisabled={!selectedClassResult}
          />
        </section>
      </div>
    </div>
  );
}

export default TeacherClassResults;
