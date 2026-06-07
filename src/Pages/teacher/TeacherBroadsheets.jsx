import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa6";

import API from "../../api/axios.jsx";
import PdfViewer from "../../components/common/PdfViewer.jsx";

function TeacherBroadsheets() {
  const [broadsheets, setBroadsheets] = useState([]);
  const [selectedBroadsheetId, setSelectedBroadsheetId] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [loadingBroadsheets, setLoadingBroadsheets] = useState(true);
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [error, setError] = useState("");
  const viewerRef = useRef(null);

  const selectedBroadsheet = useMemo(
    () =>
      broadsheets.find(
        (broadsheet) => broadsheet._id === selectedBroadsheetId
      ),
    [broadsheets, selectedBroadsheetId]
  );

  useEffect(() => {
    const fetchBroadsheets = async () => {
      try {
        setLoadingBroadsheets(true);
        setError("");

        const response = await API.get("/class-broadsheets/teacher");
        const broadsheetList = response.data || [];

        setBroadsheets(broadsheetList);

        if (broadsheetList.length > 0) {
          setSelectedBroadsheetId(broadsheetList[0]._id);
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            "Unable to load your class broadsheets."
        );
      } finally {
        setLoadingBroadsheets(false);
      }
    };

    fetchBroadsheets();
  }, []);

  const loadPdf = useCallback(async () => {
    if (!selectedBroadsheetId) {
      return;
    }

    try {
      setLoadingViewer(true);
      setError("");

      const response = await API.get(
        `/class-broadsheets/${selectedBroadsheetId}/view`,
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
          "Unable to load this broadsheet PDF."
      );
    } finally {
      setLoadingViewer(false);
    }
  }, [selectedBroadsheetId]);

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
    if (!selectedBroadsheet) {
      return;
    }

    try {
      setError("");

      const response = await API.get(
        `/class-broadsheets/${selectedBroadsheet._id}/download`,
        {
          responseType: "blob",
        }
      );

      const objectUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download =
        selectedBroadsheet.file_name ||
        `${selectedBroadsheet.class}-${selectedBroadsheet.term}-${selectedBroadsheet.session}-broadsheet.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to download this broadsheet."
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
          Class Broadsheets
        </h2>
        <p className="mt-3 max-w-2xl text-secondary/75">
          View and download the class broadsheet currently approved by admin.
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
            Approved Records
          </h3>
          <p className="mt-2 text-primary/70">
            Only broadsheets opened by admin appear here.
          </p>

          <div className="mt-6 space-y-3">
            {loadingBroadsheets ? (
              <p className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                Loading broadsheets...
              </p>
            ) : broadsheets.length === 0 ? (
              <p className="rounded-2xl bg-primary/5 p-5 text-primary/70">
                No class broadsheet is currently available.
              </p>
            ) : (
              broadsheets.map((broadsheet) => (
                <button
                  key={broadsheet._id}
                  type="button"
                  onClick={() => setSelectedBroadsheetId(broadsheet._id)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
                    selectedBroadsheetId === broadsheet._id
                      ? "border-button bg-button text-secondary"
                      : "border-primary/10 bg-primary/5 text-primary hover:border-button"
                  }`}
                >
                  <p className="font-extrabold uppercase">
                    {broadsheet.class}
                  </p>
                  <p className="mt-1 text-sm opacity-75">
                    {broadsheet.session} - {broadsheet.term}
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
                {selectedBroadsheet
                  ? `${selectedBroadsheet.class.toUpperCase()} Broadsheet`
                  : "Broadsheet Preview"}
              </h3>
              <p className="mt-2 text-primary/70">
                {selectedBroadsheet
                  ? `${selectedBroadsheet.session} - ${selectedBroadsheet.term}`
                  : "Select a broadsheet to preview."}
              </p>
            </div>

            <div className="hidden md:block"></div>
          </div>

          <PdfViewer
            title="Class Broadsheet PDF"
            viewerUrl={viewerUrl}
            loading={loadingViewer}
            emptyMessage="No broadsheet selected."
            onDownload={handleDownload}
            onReload={loadPdf}
            downloadDisabled={!selectedBroadsheet}
          />
        </section>
      </div>
    </div>
  );
}

export default TeacherBroadsheets;
