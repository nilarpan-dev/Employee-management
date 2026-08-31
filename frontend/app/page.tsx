"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  name: string;
  age: number;
  department: string;
  email: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Home() {
  // =========================
  // EMPLOYEES
  // =========================

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");

  // =========================
  // ADD EMPLOYEE
  // =========================

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");

  // =========================
  // GENERAL LOADING
  // =========================

  const [loading, setLoading] = useState(false);

  // =========================
  // EDIT
  // =========================

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // =========================
  // FETCH EMPLOYEES
  // =========================

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);

      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // =========================
  // ADD EMPLOYEE
  // =========================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !age ||
      !department.trim() ||
      !email.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/employees`, {
        method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            age: Number(age),
            department: department.trim(),
            email: email.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to create employee"
        );
      }

      // Clear form
      setName("");
      setAge("");
      setDepartment("");
      setEmail("");

      await fetchEmployees();
    } catch (error) {
      console.error("Add employee error:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Failed to add employee.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // OPEN EDIT
  // =========================

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);

    setEditName(employee.name);
    setEditAge(String(employee.age));
    setEditDepartment(employee.department);
    setEditEmail(employee.email);

    setShowEditModal(true);
  };

  // =========================
  // CLOSE EDIT
  // =========================

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingEmployee(null);

    setEditName("");
    setEditAge("");
    setEditDepartment("");
    setEditEmail("");
  };

  // =========================
  // UPDATE EMPLOYEE
  // =========================

  const handleUpdate = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!editingEmployee) {
      return;
    }

    if (
      !editName.trim() ||
      !editAge ||
      !editDepartment.trim() ||
      !editEmail.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/employees/${editingEmployee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName.trim(),
            age: Number(editAge),
            department: editDepartment.trim(),
            email: editEmail.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to update employee"
        );
      }

      closeEditModal();

      await fetchEmployees();
    } catch (error) {
      console.error("Update error:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Failed to update employee.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // DELETE EMPLOYEE
  // =========================

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText || "Failed to delete employee"
        );
      }

      await fetchEmployees();
    } catch (error) {
      console.error("Delete error:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Failed to delete employee.");
      }
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredEmployees = employees.filter(
    (employee) => {
      const searchValue = search.toLowerCase();

      return (
        employee.name
          .toLowerCase()
          .includes(searchValue) ||
        employee.department
          .toLowerCase()
          .includes(searchValue) ||
        employee.email
          .toLowerCase()
          .includes(searchValue)
      );
    }
  );

  // =========================
  // STATISTICS
  // =========================

  const departmentCount = new Set(
    employees.map(
      (employee) => employee.department
    )
  ).size;

  return (
    <main className="min-h-screen bg-[#05070D] text-white">

      {/* =========================
          BACKGROUND EFFECTS
      ========================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#F4C430]/10 blur-[120px]" />

        <div className="absolute right-0 top-80 h-96 w-96 rounded-full bg-[#2563EB]/10 blur-[120px]" />

        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-[#7C3AED]/10 blur-[120px]" />

      </div>

      <div className="relative">

        {/* =========================
            NAVBAR
        ========================= */}

        <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#05070D]/90 backdrop-blur-xl">

          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4C430] font-black text-[#05070D]">
                A
              </div>

              <div>
                <p className="text-sm font-bold tracking-[0.2em]">
                  EMPLOYEE
                </p>

                <p className="text-[10px] font-semibold tracking-[0.3em] text-[#F4C430]">
                  MANAGEMENT
                </p>
              </div>

            </div>

            <div className="hidden gap-8 text-sm text-slate-400 md:flex">

              <a
                href="#dashboard"
                className="transition hover:text-[#F4C430]"
              >
                Dashboard
              </a>

              <a
                href="#add"
                className="transition hover:text-[#F4C430]"
              >
                Add Employee
              </a>

              <a
                href="#employees"
                className="transition hover:text-[#F4C430]"
              >
                Employees
              </a>

            </div>

            <div className="rounded-full border border-[#F4C430]/30 bg-[#F4C430]/5 px-4 py-2 text-xs font-semibold text-[#F4C430]">
              ● ONLINE
            </div>

          </div>

        </nav>

        {/* =========================
            MAIN CONTAINER
        ========================= */}

        <div
          id="dashboard"
          className="mx-auto max-w-7xl px-6"
        >

          {/* =========================
              HERO
          ========================= */}

          <section className="grid items-center gap-12 py-24 lg:grid-cols-[1.2fr_0.8fr]">

            <div>

              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#F4C430]/20 bg-[#F4C430]/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F4C430]">

                <span className="h-2 w-2 rounded-full bg-[#F4C430]" />

                Workforce Platform

              </div>

              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-8xl">

                Manage your

                <span className="block text-[#F4C430]">
                  workforce.
                </span>

              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
                A modern employee management platform
                for managing employee records and departments.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">

                <a
                  href="#add"
                  className="rounded-full bg-[#F4C430] px-7 py-4 text-sm font-bold text-[#05070D] transition hover:bg-[#FFD95A]"
                >
                  Add Employee →
                </a>

                <a
                  href="#employees"
                  className="rounded-full border border-white/15 px-7 py-4 text-sm font-semibold transition hover:border-[#F4C430] hover:text-[#F4C430]"
                >
                  View Employees
                </a>

              </div>

            </div>

            {/* HERO CARD */}

            <div className="relative">

              <div className="absolute -inset-5 rounded-[2rem] bg-[#F4C430]/10 blur-3xl" />

              <div className="relative rounded-[2rem] border border-white/10 bg-[#0B1020] p-7">

                <div className="mb-8 flex items-center justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Overview
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      Workforce
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4C430] font-bold text-[#05070D]">
                    ↗
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                    <p className="text-xs text-slate-500">
                      Employees
                    </p>

                    <p className="mt-3 text-4xl font-black text-[#F4C430]">
                      {employees.length}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

                    <p className="text-xs text-slate-500">
                      Departments
                    </p>

                    <p className="mt-3 text-4xl font-black">
                      {departmentCount}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =========================
              STATS
          ========================= */}

          <section className="grid border-y border-white/10 md:grid-cols-2">

            <div className="border-b border-white/10 px-6 py-10 md:border-b-0 md:border-r">

              <p className="text-sm text-slate-500">
                Total Employees
              </p>

              <p className="mt-3 text-5xl font-black">
                {employees.length}
                <span className="text-[#F4C430]">
                  +
                </span>
              </p>

            </div>

            <div className="px-6 py-10">

              <p className="text-sm text-slate-500">
                Departments
              </p>

              <p className="mt-3 text-5xl font-black">
                {departmentCount}
              </p>

            </div>

          </section>

          {/* =========================
              ADD EMPLOYEE
          ========================= */}

          <section
            id="add"
            className="grid gap-12 py-24 lg:grid-cols-[0.7fr_1.3fr]"
          >

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#F4C430]">
                01 / Employee Creation
              </p>

              <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
                Add a new
                <span className="block text-slate-500">
                  employee.
                </span>
              </h2>

              <p className="mt-6 max-w-md leading-7 text-slate-400">
                Create and manage employee records directly in your workforce database.
              </p>

              <div className="mt-8 space-y-4">

                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-[#F4C430]">
                    ✓
                  </span>
                  MongoDB employee records
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <span className="text-[#F4C430]">
                    ✓
                  </span>
                  Full CRUD operations
                </div>

              </div>

            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#0B1020] p-7">

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* NAME */}

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter employee name"
                    className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none placeholder:text-slate-700 focus:border-[#F4C430]"
                  />

                </div>

                {/* AGE + DEPARTMENT */}

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Age
                    </label>

                    <input
                      type="number"
                      value={age}
                      onChange={(e) =>
                        setAge(e.target.value)
                      }
                      placeholder="25"
                      className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none placeholder:text-slate-700 focus:border-[#F4C430]"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Department
                    </label>

                    <input
                      type="text"
                      value={department}
                      onChange={(e) =>
                        setDepartment(
                          e.target.value
                        )
                      }
                      placeholder="Engineering"
                      className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none placeholder:text-slate-700 focus:border-[#F4C430]"
                    />

                  </div>

                </div>

                {/* EMAIL */}

                <div>

                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="employee@gmail.com"
                    className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none placeholder:text-slate-700 focus:border-[#F4C430]"
                  />

                </div>

                {/* ADD BUTTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#F4C430] px-6 py-4 font-bold text-[#05070D] transition hover:bg-[#FFD95A] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {loading
                    ? "Adding Employee..."
                    : "＋ Add Employee"}
                </button>

              </form>

            </div>

          </section>

          {/* =========================
              EMPLOYEE DIRECTORY
          ========================= */}

          <section
            id="employees"
            className="pb-24"
          >

            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#F4C430]">
                  02 / Workforce
                </p>

                <h2 className="mt-4 text-4xl font-black sm:text-5xl">
                  Employee directory.
                </h2>

              </div>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search employees..."
                className="w-full rounded-full border border-white/10 bg-[#0B1020] px-6 py-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#F4C430] lg:w-80"
              />

            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1020]">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>

                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-600">

                      <th className="px-7 py-5">
                        Employee
                      </th>

                      <th className="px-7 py-5">
                        Age
                      </th>

                      <th className="px-7 py-5">
                        Department
                      </th>

                      <th className="px-7 py-5">
                        Email
                      </th>

                      <th className="px-7 py-5">
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredEmployees.map(
                      (employee) => (
                        <tr
                          key={employee.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.025]"
                        >

                          <td className="px-7 py-6">

                            <div className="flex items-center gap-4">

                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4C430] font-black text-[#05070D]">
                                {employee.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="font-bold">
                                  {employee.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                  Employee
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-7 py-6 text-slate-400">
                            {employee.age}
                          </td>

                          <td className="px-7 py-6">

                            <span className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-1.5 text-xs font-medium text-[#A78BFA]">
                              {employee.department}
                            </span>

                          </td>

                          <td className="px-7 py-6 text-slate-500">
                            {employee.email}
                          </td>

                          <td className="px-7 py-6">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    employee
                                  )
                                }
                                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-[#F4C430] hover:text-[#F4C430]"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    employee.id
                                  )
                                }
                                className="rounded-full border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {filteredEmployees.length === 0 && (
                <div className="px-6 py-20 text-center">

                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl">
                    👥
                  </div>

                  <h3 className="text-lg font-bold">
                    No employees found
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    Add an employee or change your
                    search.
                  </p>

                </div>
              )}

            </div>

          </section>

          {/* =========================
              FOOTER
          ========================= */}

          <footer className="border-t border-white/10 py-12">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-sm font-bold tracking-[0.2em]">
                  EMPLOYEE HUB
                </p>

                <p className="mt-2 text-xs text-slate-600">
                  Next.js • Go • MongoDB  copyright@ Nilarpan Guha Niyogi
                </p>

              </div>

              <p className="text-sm text-slate-600">
                Workforce management, simplified.
              </p>

            </div>

          </footer>

        </div>
      </div>

      {/* =========================
          EDIT MODAL
      ========================= */}

      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0B1020] p-7 shadow-2xl">

            <div className="mb-7 flex items-start justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4C430]">
                  Employee
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Edit employee
                </h2>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xl text-slate-500 transition hover:border-[#F4C430] hover:text-[#F4C430]"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-5"
            >

              <div>

                <label className="mb-2 block text-xs uppercase tracking-wider text-slate-600">
                  Full Name
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(e) =>
                    setEditName(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none focus:border-[#F4C430]"
                />

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="mb-2 block text-xs uppercase tracking-wider text-slate-600">
                    Age
                  </label>

                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) =>
                      setEditAge(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none focus:border-[#F4C430]"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs uppercase tracking-wider text-slate-600">
                    Department
                  </label>

                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) =>
                      setEditDepartment(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none focus:border-[#F4C430]"
                  />

                </div>

              </div>

              <div>

                <label className="mb-2 block text-xs uppercase tracking-wider text-slate-600">
                  Email
                </label>

                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) =>
                    setEditEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#05070D] px-4 py-4 text-white outline-none focus:border-[#F4C430]"
                />

              </div>

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-[#F4C430] px-6 py-3 text-sm font-bold text-[#05070D] transition hover:bg-[#FFD95A] disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}