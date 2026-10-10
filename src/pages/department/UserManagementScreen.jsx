import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SearchInput } from '../../components/common/SearchInput';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DEMO_USERS } from '../../data/demoUsers';
import { UserPlus, Edit, Trash2 } from 'lucide-react';

export const UserManagementScreen = () => {
  const [users, setUsers] = useState([
    { id: 'usr-01', name: 'Dr. Rajesh Verma', email: 'r.verma@pwd.gov.in', role: 'Road Department Officer', status: 'Active' },
    { id: 'usr-02', name: 'Vikram Malhotra', email: 'vikram.m@pathrakshak.gov.in', role: 'Field Operator', status: 'Active' },
    { id: 'usr-03', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'Citizen', status: 'Active' },
    { id: 'usr-04', name: 'Er. S. K. Gupta', email: 'sk.gupta@pwd.gov.in', role: 'Repair Engineer', status: 'Active' },
  ]);

  const [search, setSearch] = useState('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Road Department Officer');

  const filtered = (users || []).filter(u => {
    if (!u) return false;
    const searchLower = (search || '').toLowerCase();
    if (!searchLower) return true;
    return (
      (u.name || u.displayName || '').toLowerCase().includes(searchLower) ||
      (u.email || '').toLowerCase().includes(searchLower) ||
      (u.role || '').toLowerCase().includes(searchLower)
    );
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      status: 'Active'
    };
    setUsers([...users, newUser]);
    setAddUserOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div>
      <PageHeader
        title="System User & Staff Management"
        description="Manage role-based access control, departmental accounts, and field personnel permissions."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setAddUserOpen(true)}>
            Add New User
          </Button>
        }
      />

      <Card>
        <div style={{ marginBottom: '1.25rem' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by Name, Email, Role..."
          />
        </div>

        <Table headers={['User ID', 'Name', 'Email Address', 'Assigned Role', 'Account Status', 'Actions']}>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{u.id}</td>
              <td style={{ fontWeight: 600 }}>{u.name}</td>
              <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
              <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.role}</td>
              <td><Badge status="Verified">{u.status}</Badge></td>
              <td>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <Button variant="outline" size="sm" icon={Edit}>Edit</Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        title="Register New Personnel Account"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddUser}>Create User</Button>
          </>
        }
      >
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Official Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Select
          label="System Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={['Road Department Officer', 'Field Operator', 'Citizen', 'Repair Engineer']}
        />
      </Modal>
    </div>
  );
};
