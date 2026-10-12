import { useEffect, useState, useRef } from 'react';
import studentService from '../services/studentService';
import SkeletonTable from './SkeletonTable';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import Loader from './Loader';

function StudentTable({ refreshKey = 0 }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Confirm Modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Debounce ref
  const searchTimeoutRef = useRef(null);

  // INITIAL FETCH
  useEffect(() => {
    let isMounted = true;
    studentService.getStudents()
      .then((data) => {
        if (isMounted) {
          setStudents(data.data || []);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error('Failed to fetch students:', error.response?.data || error.message);
          setToast({
            message: error.response?.data?.msg || 'Failed to fetch students',
            type: 'error',
          });
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // RE-FETCH HELPER
  const reloadStudents = async () => {
    try {
      const data = await studentService.getStudents();
      setStudents(data.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error.response?.data || error.message);
    }
  };

  // DEBOUNCED SEARCH HANDLER
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (!value.trim()) {
        reloadStudents();
        return;
      }

      try {
        setSearchLoading(true);
        const data = await studentService.searchStudents(value.trim());
        setStudents(data.data || []);
      } catch (error) {
        console.error('Search failed:', error.response?.data || error.message);
        setToast({
          message: error.response?.data?.msg || 'Search failed',
          type: 'error',
        });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  // CLEANUP SEARCH TIMEOUT
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // FILTERED STUDENTS
  const filteredStudents = students.filter((student) => {
    if (paymentFilter === 'paid') return student.isPaid === true;
    if (paymentFilter === 'unpaid') return student.isPaid === false;
    return true;
  });

  // PAGINATION COMPUTATION
  const totalStudents = filteredStudents.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalStudents / pageSize));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedStudents = pageSize === 'all'
    ? filteredStudents
    : filteredStudents.slice((activePage - 1) * pageSize, activePage * pageSize);

  // DELETE CONFIRMATION HANDLER
  const confirmDeleteStudent = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await studentService.deleteStudent(deleteTarget._id);
      setStudents((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      setToast({
        message: `Student "${deleteTarget.name}" deleted successfully`,
        type: 'success',
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error('Delete failed:', error.response?.data || error.message);
      setToast({
        message: error.response?.data?.msg || 'Failed to delete student',
        type: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // SEND TICKET / TOGGLE PAYMENT HANDLER
  const handleTicket = async (student) => {
    if (
      student.ticketStatus === 'QUEUED' ||
      student.ticketStatus === 'PROCESSING'
    ) {
      return;
    }

    const previousStudentState = { ...student };

    // OPTIMISTIC UPDATE
    setStudents((prev) =>
      prev.map((s) =>
        s._id === student._id
          ? {
              ...s,
              ticketStatus: !student.isPaid ? 'QUEUED' : s.ticketStatus,
            }
          : s
      )
    );

    try {
      const response = await studentService.sendTicket(student._id);

      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id
            ? {
                ...s,
                isPaid: response.isPaid ?? s.isPaid,
                ticketStatus: response.ticketStatus || s.ticketStatus,
              }
            : s
        )
      );

      setToast({
        message: response.isPaid
          ? `Pass queued/sent for ${student.name}`
          : `Payment status updated for ${student.name}`,
        type: 'success',
      });
    } catch (error) {
      console.error('Ticket error:', error.response?.data || error.message);

      // REVERT OPTIMISTIC UPDATE
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? previousStudentState : s))
      );

      setToast({
        message: error.response?.data?.msg || 'Failed to update ticket status',
        type: 'error',
      });
    }
  };

  // OPTIMIZED TICKET POLLING (Every 3 seconds if items queued/processing)
  useEffect(() => {
    const hasProcessing = students.some(
      (s) => s.ticketStatus === 'QUEUED' || s.ticketStatus === 'PROCESSING'
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      reloadStudents();
    }, 3000);

    return () => clearInterval(interval);
  }, [students]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-6" aria-label="Student management section">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Students
        </h2>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* SEARCH INPUT */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by email..."
            aria-label="Search students by email"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchLoading && (
            <div className="absolute right-3 top-3">
              <Loader />
            </div>
          )}
        </div>

        {/* PAYMENT FILTER */}
        <div className="flex items-center gap-3">
          <label htmlFor="payment-filter" className="text-sm font-medium text-gray-700">
            Payment:
          </label>
          <select
            id="payment-filter"
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter students by payment status"
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* TABLE DATA / SKELETON */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Students List">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700">Phone Number</th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700">Branch</th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700">Year</th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700 text-center">Ticket</th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-700 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-gray-600">{student.studentId}</td>
                      <td className="px-4 py-3 text-gray-600">{student.branch}</td>
                      <td className="px-4 py-3 text-gray-600">{student.Year}</td>

                      <td className="px-4 py-3 text-center">
                        {student.ticketStatus === 'QUEUED' || student.ticketStatus === 'PROCESSING' ? (
                          <div className="flex justify-center" aria-label="Ticket processing">
                            <Loader />
                          </div>
                        ) : (
                          <input
                            type="checkbox"
                            checked={student.isPaid}
                            onChange={() => handleTicket(student)}
                            aria-label={`Toggle payment for ${student.name}`}
                            className="w-5 h-5 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                          />
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(student)}
                          aria-label={`Delete student ${student.name}`}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {!loading && totalStudents > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
              aria-label="Items per page"
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
            <span>per page</span>
            <span className="text-xs text-gray-500 ml-2">
              (Showing {pageSize === 'all' ? 1 : (activePage - 1) * pageSize + 1} -{' '}
              {pageSize === 'all' ? totalStudents : Math.min(activePage * pageSize, totalStudents)} of {totalStudents})
            </span>
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={activePage === 1}
                aria-label="Previous Page"
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-xs text-gray-700">
                Page {activePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={activePage === totalPages}
                aria-label="Next Page"
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDeleteStudent}
        onClose={() => setDeleteTarget(null)}
      />

      {/* TOAST NOTIFICATION */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </section>
  );
}

export default StudentTable;
