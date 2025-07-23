'use client';

import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface User {
  id?: number;
  employee_code: string;
  email: string;
  full_name: string;
  department: string;
  designation: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'inactive' | 'locked';
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: () => void;
  departments: string[];
}

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Administrator' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function UserModal({ isOpen, onClose, user, onSave, departments }: UserModalProps) {
  const [formData, setFormData] = useState({
    employee_code: '',
    email: '',
    full_name: '',
    department: '',
    designation: '',
    role: 'employee' as const,
    status: 'active' as const,
    password: '',
    must_change_password: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [customDepartment, setCustomDepartment] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        employee_code: user.employee_code,
        email: user.email,
        full_name: user.full_name,
        department: user.department,
        designation: user.designation,
        role: user.role,
        status: user.status,
        password: '',
        must_change_password: false,
      });
      setCustomDepartment(!departments.includes(user.department));
    } else {
      setFormData({
        employee_code: '',
        email: '',
        full_name: '',
        department: departments[0] || '',
        designation: '',
        role: 'employee',
        status: 'active',
        password: '',
        must_change_password: true,
      });
      setCustomDepartment(false);
    }
    setErrors({});
  }, [user, departments, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_code.trim()) {
      newErrors.employee_code = 'Employee code is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }

    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const endpoint = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ...(formData.password ? { password: formData.password } : {}),
        }),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save user' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 text-center sm:ml-0 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {user ? 'Edit User' : 'Add New User'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {errors.submit && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                          {errors.submit}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Employee Code *
                          </label>
                          <input
                            type="text"
                            name="employee_code"
                            value={formData.employee_code}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full rounded-md border ${
                              errors.employee_code ? 'border-red-300' : 'border-gray-300'
                            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                          />
                          {errors.employee_code && (
                            <p className="mt-1 text-sm text-red-600">{errors.employee_code}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full rounded-md border ${
                              errors.email ? 'border-red-300' : 'border-gray-300'
                            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md border ${
                            errors.full_name ? 'border-red-300' : 'border-gray-300'
                          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                        />
                        {errors.full_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Department *
                        </label>
                        {!customDepartment ? (
                          <div className="flex space-x-2">
                            <select
                              name="department"
                              value={formData.department}
                              onChange={handleInputChange}
                              className="mt-1 block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            >
                              {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setCustomDepartment(true)}
                              className="mt-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-500"
                            >
                              Custom
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              name="department"
                              value={formData.department}
                              onChange={handleInputChange}
                              placeholder="Enter custom department"
                              className="mt-1 block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomDepartment(false);
                                setFormData(prev => ({ ...prev, department: departments[0] || '' }));
                              }}
                              className="mt-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-500"
                            >
                              Select
                            </button>
                          </div>
                        )}
                        {errors.department && (
                          <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Designation *
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md border ${
                            errors.designation ? 'border-red-300' : 'border-gray-300'
                          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                        />
                        {errors.designation && (
                          <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Role *
                          </label>
                          <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            {ROLES.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Status *
                          </label>
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {user ? 'New Password (leave blank to keep current)' : 'Password *'}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`mt-1 block w-full rounded-md border ${
                            errors.password ? 'border-red-300' : 'border-gray-300'
                          } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                      </div>

                      {!user && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="must_change_password"
                            checked={formData.must_change_password}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-700">
                            Require password change on first login
                          </label>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 sm:ml-3 sm:w-auto"
                        >
                          {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}