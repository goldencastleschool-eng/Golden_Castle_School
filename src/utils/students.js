export const sortStudentsByName = (students = []) =>
  [...students].sort((firstStudent, secondStudent) => {
    const nameCompare = (firstStudent.full_name || "").localeCompare(
      secondStudent.full_name || "",
      undefined,
      {
        sensitivity: "base",
      }
    );

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return (firstStudent.admission_no || "").localeCompare(
      secondStudent.admission_no || "",
      undefined,
      {
        sensitivity: "base",
      }
    );
  });
