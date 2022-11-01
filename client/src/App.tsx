import { useEffect, useState } from "react";
import { Routes, Route, useParams } from "react-router-dom";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1>Client is running 🏃</h1>
            </>
          }
        />
        <Route path="/p/:uid" element={<Profile />} />
      </Routes>
    </main>
  );
}

interface PatientData {
  name: string;
  id: string;
  dept: string;
  data: string;
}

const Profile = () => {
  const { uid } = useParams();

  const [patientData, setPatientData] = useState<PatientData>({
    name: "",
    id: "",
    dept: "",
    data: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatientData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/profile/${uid}`);
      const data = await response.json();
      if (response.status === 200) {
        setPatientData(data);
      } else {
        throw new Error(data?.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  const updatePatientData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/profile/${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: patientData.data,
        }),
      });
      const resData = await response.json();
      if (response.status === 200) {
        fetchPatientData();
      } else {
        throw new Error(resData?.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPatientData();
  }, [uid]);

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {patientData.id ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updatePatientData();
              }}
            >
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center gap-4 w-full max-w-md">
                  <span className="font-bold text-lg">Name:</span>
                  <p>{patientData.name}</p>
                </label>
                <label className="flex items-center gap-4 w-full max-w-md">
                  <span className="font-bold text-lg">ID:</span>
                  <p>{patientData.id}</p>
                </label>
                <label className="flex items-center gap-4 w-full max-w-md">
                  <span className="font-bold text-lg">Department:</span>
                  <p>{patientData.dept}</p>
                </label>
                <label className="flex flex-col gap-4 w-full max-w-lg">
                  <span className="font-bold text-lg">Data:</span>
                  <textarea
                    placeholder="Patient Data"
                    className="block h-80"
                    value={patientData.data}
                    onChange={(e) => {
                      setPatientData({
                        ...patientData,
                        data: e.target.value,
                      });
                    }}
                  />
                </label>
                <button
                  type="submit"
                  className="w-fit bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          ) : (
            <div>An error occured</div>
          )}
        </>
      )}
    </>
  );
};
