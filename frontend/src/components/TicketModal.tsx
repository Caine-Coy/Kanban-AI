import { useState, useEffect } from 'react';
import type { Ticket } from 'shared';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onSuccess?: () => void;
  projectId?: string;
}

export function TicketModal({ isOpen, onClose, ticket, onSuccess, projectId }: TicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title,
        description: ticket.description,
        requirements: ticket.requirements || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        requirements: '',
      });
    }
  }, [ticket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (ticket) {
        // Update existing ticket
        const res = await fetch(`/api/tickets/${ticket.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error('Failed to update ticket');

        // Refresh the board after update
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Create new ticket
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, projectId }),
        });

        if (!res.ok) throw new Error('Failed to create ticket');

        // Refresh the board to show the new ticket
        if (onSuccess) {
          onSuccess();
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to save ticket:', error);
      alert('Failed to save ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;

    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete ticket');
      
      // Refresh the board after deletion
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket: ' + (error as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">
            {ticket ? 'Edit Ticket' : 'Create Ticket'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter ticket title"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Describe what needs to be done"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Requirements (Optional)
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Specific requirements, acceptance criteria, technical details..."
            />
          </div>

          {ticket && (
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                <strong>Status:</strong> {ticket.status}
              </div>
              {ticket.branch && (
                <div className="text-sm text-slate-400">
                  <strong>Branch:</strong> {ticket.branch}
                </div>
              )}
              {ticket.createdAt && (
                <div className="text-sm text-slate-400">
                  <strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-3 pt-6 border-t border-slate-700">
            {ticket ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Saving...' : ticket ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
