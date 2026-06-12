import { isSecondaryClass } from "./classSections.js";

export const TEACHER_ASSIGNMENT_TYPES = {
  FORM: "form_teacher",
  CLASS: "class_teacher",
};

export const TEACHER_ASSIGNMENT_OPTIONS = [
  {
    value: TEACHER_ASSIGNMENT_TYPES.FORM,
    label: "Form Teacher",
  },
  {
    value: TEACHER_ASSIGNMENT_TYPES.CLASS,
    label: "Class Teacher",
  },
];

const TEACHER_ASSIGNMENT_LABELS = TEACHER_ASSIGNMENT_OPTIONS.reduce(
  (labels, option) => ({
    ...labels,
    [option.value]: option.label,
  }),
  {}
);

const compactValue = (value = "") =>
  value.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

export const normalizeTeacherAssignmentType = (assignmentType = "") => {
  const compactType = compactValue(assignmentType);

  if (!compactType) {
    return "";
  }

  if (compactType === "form" || compactType === "formteacher") {
    return TEACHER_ASSIGNMENT_TYPES.FORM;
  }

  if (compactType === "class" || compactType === "classteacher") {
    return TEACHER_ASSIGNMENT_TYPES.CLASS;
  }

  return Object.values(TEACHER_ASSIGNMENT_TYPES).includes(assignmentType)
    ? assignmentType
    : "";
};

export const getTeacherAssignmentType = (teacher = {}) =>
  normalizeTeacherAssignmentType(teacher.assignment_type) ||
  TEACHER_ASSIGNMENT_TYPES.FORM;

export const isFormTeacher = (teacher = {}) =>
  getTeacherAssignmentType(teacher) === TEACHER_ASSIGNMENT_TYPES.FORM;

export const getAssignmentOptionsForClass = (classRecord) =>
  isSecondaryClass(classRecord)
    ? TEACHER_ASSIGNMENT_OPTIONS
    : TEACHER_ASSIGNMENT_OPTIONS.filter(
        (option) => option.value === TEACHER_ASSIGNMENT_TYPES.FORM
      );

export const formatTeacherAssignmentType = (assignmentType = "") =>
  TEACHER_ASSIGNMENT_LABELS[
    normalizeTeacherAssignmentType(assignmentType) ||
      TEACHER_ASSIGNMENT_TYPES.FORM
  ];
