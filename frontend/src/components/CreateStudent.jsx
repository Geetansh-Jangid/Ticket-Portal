import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Loader from './Loader';
import studentService from '../services/studentService';
import { BRANCH_OPTIONS, YEAR_OPTIONS } from '../constants/student';

function CreateStudent({ onClose, onStudentCreated }) {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      studentId: '',
      email: '',
      branch: '',
      Year: '',
    },
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    setSuccess('');

    try {
      const response = await studentService.createStudent({
        name: data.name.trim(),
        studentId: data.studentId.trim(),
        email: data.email.trim(),
        branch: data.branch,
        Year: Number(data.Year),
      });

      setSuccess('Student created successfully.');
      reset();

      if (onStudentCreated) {
        onStudentCreated(response.student);
      }
    } catch (err) {
      console.error('Create student error:', err.response?.data || err.message);
      setServerError(
        err.response?.data?.msg || 'Failed to create student'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
              Add Student
            </h2>
            <p className="text-sm text-gray-500">
              Enter student details below.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close add student dialog"
            className="text-gray-500 hover:text-gray-900 text-2xl leading-none px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <label htmlFor="student-name" className="block text-sm font-medium mb-1 text-gray-700">
              Name
            </label>
            <input
              id="student-name"
              type="text"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Student name"
            />
            {errors.name && (
              <p role="alert" className="text-xs text-red-600 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Number / Student ID */}
          <div>
            <label htmlFor="student-phone" className="block text-sm font-medium mb-1 text-gray-700">
              Phone Number
            </label>
            <input
              id="student-phone"
              type="tel"
              {...register('studentId', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit phone number',
                },
              })}
              className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${
                errors.studentId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="10-digit phone number"
            />
            {errors.studentId && (
              <p role="alert" className="text-xs text-red-600 mt-1">
                {errors.studentId.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="student-email" className="block text-sm font-medium mb-1 text-gray-700">
              Email
            </label>
            <input
              id="student-email"
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Please enter a valid email address',
                },
              })}
              className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="student@example.com"
            />
            {errors.email && (
              <p role="alert" className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label htmlFor="student-branch" className="block text-sm font-medium mb-1 text-gray-700">
              Branch
            </label>
            <select
              id="student-branch"
              {...register('branch', { required: 'Please select a branch' })}
              className={`w-full border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 ${
                errors.branch ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select branch</option>
              {BRANCH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.branch && (
              <p role="alert" className="text-xs text-red-600 mt-1">
                {errors.branch.message}
              </p>
            )}
          </div>

          {/* Year */}
          <div>
            <label htmlFor="student-year" className="block text-sm font-medium mb-1 text-gray-700">
              Year
            </label>
            <select
              id="student-year"
              {...register('Year', { required: 'Please select a year' })}
              className={`w-full border rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 ${
                errors.Year ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Select year</option>
              {YEAR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.Year && (
              <p role="alert" className="text-xs text-red-600 mt-1">
                {errors.Year.message}
              </p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          )}

          {success && (
            <p role="status" className="text-sm text-green-600">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              {loading && <Loader />}
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStudent;
