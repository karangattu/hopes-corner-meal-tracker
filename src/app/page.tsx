'use client';

import { useState, useEffect, useRef } from 'react';
import type { Guest } from '@/lib/supabase';

type GuestListResponse = {
  guests?: Guest[];
  message?: string;
};

type TotalsResponse = {
  total?: number;
  message?: string;
};

type MealResponse = {
  success?: boolean;
  message?: string;
};

// Debounce helper for the search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function MealTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [recentMeals, setRecentMeals] = useState<
    { guest: Guest; quantity: number; time: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch matching guests whenever the debounced query changes
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setGuests([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const response = await fetch(
          `/api/guests?q=${encodeURIComponent(debouncedSearch)}`
        );
        const payload = (await response.json()) as GuestListResponse;

        if (!response.ok) {
          throw new Error(payload?.message ?? 'Unable to search guests.');
        }

        if (!cancelled) {
          setGuests(payload.guests ?? []);
        }
      } catch (error) {
        console.error('Error searching guests:', error);
        if (!cancelled) {
          setGuests([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  // Load today's total meals and refresh regularly
  useEffect(() => {
    let cancelled = false;

    const loadTodayTotal = async () => {
      try {
        const response = await fetch('/api/totals');
        const payload = (await response.json()) as TotalsResponse;

        if (!response.ok) {
          throw new Error(payload?.message ?? 'Unable to load totals.');
        }

        if (!cancelled) {
          setTodayTotal(payload.total ?? 0);
        }
      } catch (error) {
        console.error("Error loading today's total:", error);
      }
    };

    loadTodayTotal();
    const interval = setInterval(loadTodayTotal, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const recordMeal = async (guest: Guest, quantity: 1 | 2) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId: guest.id, quantity }),
      });
      const payload = (await response.json()) as MealResponse;

      if (response.status === 409) {
        alert(`${guest.full_name} has already received a meal today.`);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Failed to record meal.');
      }

      setRecentMeals((prev) => [
        { guest, quantity, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);

      setTodayTotal((prev) => prev + quantity);
      setSelectedGuest(null);
      setSearchQuery('');
      setGuests([]);
      searchInputRef.current?.focus();
    } catch (error) {
      console.error('Error recording meal:', error);
      alert('Failed to record meal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (guest: Guest) => {
    if (guest.preferred_name && guest.preferred_name !== guest.full_name) {
      return `${guest.preferred_name} (${guest.full_name})`;
    }
    return guest.full_name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-800">🍽️ Meal Tracker</h1>
              <p className="text-sm text-gray-600">Hope&apos;s Corner Quick Check-in</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-600">{todayTotal}</div>
              <div className="text-xs text-gray-600">meals today</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search Guest by Name or ID
          </label>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type guest name..."
            className="w-full px-4 py-3 text-lg text-gray-900 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-slate-500 placeholder:opacity-100"
            autoFocus
          />

          {/* Search Results */}
          {loading && (
            <div className="mt-4 text-center text-gray-600">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
              <span className="ml-2">Searching...</span>
            </div>
          )}

          {!loading && guests.length > 0 && (
            <div className="mt-4 space-y-2">
              {guests.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => setSelectedGuest(guest)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedGuest?.id === guest.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{getDisplayName(guest)}</div>
                  <div className="text-sm text-gray-600 flex gap-2">
                    <span>ID: {guest.external_id}</span>
                    <span>•</span>
                    <span>{guest.housing_status}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && searchQuery.length >= 2 && guests.length === 0 && (
            <div className="mt-4 text-center text-gray-600 py-4">
              No guests found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Meal Buttons */}
        {selectedGuest && (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-gray-900">
                {getDisplayName(selectedGuest)}
              </div>
              <div className="text-sm text-gray-600">
                How many meals?
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => recordMeal(selectedGuest, 1)}
                disabled={submitting}
                className="py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : '1 Meal'}
              </button>
              <button
                onClick={() => recordMeal(selectedGuest, 2)}
                disabled={submitting}
                className="py-6 rounded-2xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-bold text-2xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '...' : '2 Meals'}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedGuest(null);
                searchInputRef.current?.focus();
              }}
              className="mt-4 w-full py-2 text-gray-600 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Recent Meals */}
        {recentMeals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Recent Entries
            </h2>
            <div className="space-y-2">
              {recentMeals.map((entry, index) => (
                <div
                  key={`${entry.guest.id}-${entry.time}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    index === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {entry.guest.preferred_name || entry.guest.full_name}
                    </div>
                    <div className="text-xs text-gray-600">{entry.time}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${
                        entry.quantity === 2
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {entry.quantity} meal{entry.quantity > 1 ? 's' : ''}
                    </span>
                    {index === 0 && (
                      <span className="text-emerald-500 text-lg">✓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        <div className="text-center text-xs text-gray-600 py-4">
          Quick tip: Start typing a name to search, click to select, then tap 1 or 2 meals
        </div>
      </main>
    </div>
  );
}
