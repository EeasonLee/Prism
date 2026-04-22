'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, MapPin, Home, CreditCard } from 'lucide-react';
import { AccountScaffold } from '../components/AccountScaffold';
import { useAuth } from '@/lib/auth/context';
import { useAccount } from '@/lib/account/useAccount';
import type { Address, AddressInput } from '@/lib/api/bff/account/types';
import { Button } from '@prism/ui/components/button';
import { Sheet } from '@prism/ui/components/sheet';
import { Checkbox } from '@prism/ui/components/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@prism/ui/components/select';

interface FormData {
  firstname: string;
  lastname: string;
  street1: string;
  street2: string;
  city: string;
  region: string;
  region_id?: number;
  postcode: string;
  country_code: string;
  telephone: string;
  default_billing: boolean;
  default_shipping: boolean;
}

function emptyForm(): FormData {
  return {
    firstname: '',
    lastname: '',
    street1: '',
    street2: '',
    city: '',
    region: '',
    postcode: '',
    country_code: 'US',
    telephone: '',
    default_billing: false,
    default_shipping: false,
  };
}

function addressToForm(address: Address): FormData {
  const streetParts = address.street.split(', ');
  return {
    firstname: address.firstname,
    lastname: address.lastname,
    street1: streetParts[0] ?? '',
    street2: streetParts[1] ?? '',
    city: address.city,
    region: address.region,
    region_id: address.regionId,
    postcode: address.postcode,
    country_code: address.country,
    telephone: address.telephone,
    default_billing: address.defaultBilling,
    default_shipping: address.defaultShipping,
  };
}

function formToInput(form: FormData): AddressInput {
  const street: string[] = [form.street1];
  if (form.street2.trim()) {
    street.push(form.street2);
  }
  const region: AddressInput['region'] = {
    region: form.region.trim(),
    region_code: form.region.trim(),
  };
  if (form.region_id != null) {
    region.region_id = form.region_id;
  }
  return {
    firstname: form.firstname.trim(),
    lastname: form.lastname.trim(),
    street,
    city: form.city.trim(),
    region,
    postcode: form.postcode.trim(),
    country_code: form.country_code.trim(),
    telephone: form.telephone.trim(),
    default_billing: form.default_billing,
    default_shipping: form.default_shipping,
  };
}

function validateForm(form: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.firstname.trim()) errors.firstname = 'First name is required';
  if (!form.lastname.trim()) errors.lastname = 'Last name is required';
  if (!form.street1.trim()) errors.street1 = 'Street address is required';
  if (!form.city.trim()) errors.city = 'City is required';
  if (!form.region.trim()) errors.region = 'State / Region is required';
  if (!form.postcode.trim()) errors.postcode = 'ZIP / Postal code is required';
  if (!form.country_code.trim()) errors.country_code = 'Country is required';
  return errors;
}

function inputClass(error?: string): string {
  const base =
    'w-full rounded-lg border bg-background px-3 py-2 text-sm text-ink outline-none transition';
  const normal = 'border-border focus:border-brand focus:ring-1 focus:ring-brand';
  const invalid = 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500';
  return `${base} ${error ? invalid : normal}`;
}

function selectTriggerClass(error?: string): string {
  const base =
    'flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-ink outline-none transition';
  const normal = 'border-border focus:border-brand focus:ring-1 focus:ring-brand';
  const invalid = 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500';
  return `${base} ${error ? invalid : normal}`;
}

const SUPPORTED_COUNTRIES =
  (process.env.NEXT_PUBLIC_SUPPORTED_COUNTRIES ?? 'US')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

export default function AccountAddressesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
  const {
    addresses,
    isLoading,
    error,
    logout,
    addAddress,
    updateAddress,
    deleteAddress,
    getCountries,
    getRegions,
    refresh,
  } = useAccount({
    loadUser: false,
    loadOrders: false,
    loadAddresses: true,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [countries, setCountries] = useState<Array<{ id: string; full_name_english: string }>>([]);
  const [regions, setRegions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);

  const fieldRefs = {
    firstname: useRef<HTMLInputElement>(null),
    lastname: useRef<HTMLInputElement>(null),
    street1: useRef<HTMLInputElement>(null),
    street2: useRef<HTMLInputElement>(null),
    city: useRef<HTMLInputElement>(null),
    region: useRef<HTMLInputElement>(null),
    postcode: useRef<HTMLInputElement>(null),
    telephone: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?next=/account/addresses');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadRegions = useCallback(
    async (countryCode: string) => {
      if (!countryCode) {
        setRegions([]);
        return;
      }
      setRegionsLoading(true);
      try {
        const data = await getRegions(countryCode);
        setRegions(data);
      } catch {
        setRegions([]);
      } finally {
        setRegionsLoading(false);
      }
    },
    [getRegions]
  );

  const openAdd = useCallback(() => {
    setEditingAddress(null);
    setForm(emptyForm());
    setFieldErrors({});
    setRegions([]);
    setSheetOpen(true);
    void getCountries().then(data => {
      const filtered = data.filter(c => SUPPORTED_COUNTRIES.includes(c.id));
      setCountries(filtered.length > 0 ? filtered : data);
    });
    void loadRegions('US');
  }, [getCountries, loadRegions]);

  const openEdit = useCallback(
    (address: Address) => {
      setEditingAddress(address);
      setForm(addressToForm(address));
      setFieldErrors({});
      setSheetOpen(true);
      void getCountries().then(data => {
        const filtered = data.filter(c => SUPPORTED_COUNTRIES.includes(c.id));
        setCountries(filtered.length > 0 ? filtered : data);
      });
      void loadRegions(address.country);
    },
    [getCountries, loadRegions]
  );

  const handleCountryChange = useCallback(
    (value: string) => {
      setForm(prev => ({ ...prev, country_code: value, region: '', region_id: undefined }));
      setFieldErrors(prev => {
        const { country_code: _, region: _r, ...rest } = prev;
        return rest;
      });
      void loadRegions(value);
    },
    [loadRegions]
  );

  const handleRegionChange = useCallback((value: string) => {
    const region = regions.find(r => r.code === value);
    setForm(prev => ({
      ...prev,
      region: region?.name ?? value,
      region_id: region ? Number.parseInt(region.id, 10) : undefined,
    }));
    setFieldErrors(prev => {
      const { region: _, ...rest } = prev;
      return rest;
    });
  }, [regions]);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(form);
    setFieldErrors(errors);

    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const ref = fieldRefs[firstErrorKey as keyof typeof fieldRefs];
      ref?.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const input = formToInput(form);
      if (editingAddress) {
        await updateAddress(editingAddress.id, input);
      } else {
        await addAddress(input);
      }
      setSheetOpen(false);
      await refresh();
    } catch (err) {
      setFieldErrors({
        submit: err instanceof Error ? err.message : 'Failed to save address',
      });
    } finally {
      setSubmitting(false);
    }
  }, [form, editingAddress, addAddress, updateAddress, refresh]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm('Are you sure you want to delete this address?')) return;
      setDeletingId(id);
      try {
        await deleteAddress(id);
        await refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete address');
      } finally {
        setDeletingId(null);
      }
    },
    [deleteAddress, refresh]
  );

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      await refreshSession();
      router.replace('/login');
    } finally {
      setLogoutLoading(false);
    }
  }, [logout, refreshSession, router]);

  if (authLoading || isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-xl bg-surface" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">Redirecting to sign in...</p>
      </main>
    );
  }

  return (
    <AccountScaffold
      title="Addresses"
      description="Manage your saved shipping and billing addresses."
      onLogout={handleLogout}
      logoutLoading={logoutLoading}
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} saved
        </p>
        <Button variant="brand" size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <MapPin className="mx-auto h-8 w-8 text-ink-muted" />
          <p className="mt-3 text-sm text-ink-muted">No addresses found.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add your first address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map(address => (
            <article
              key={address.id}
              className="relative rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-ink">
                    {address.firstname} {address.lastname}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{address.street}</p>
                  <p className="text-sm text-ink-muted">
                    {address.city}
                    {address.region ? `, ${address.region}` : ''}{' '}
                    {address.postcode}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {address.country}
                  </p>
                  {address.telephone && (
                    <p className="mt-1 text-sm text-ink-muted">
                      {address.telephone}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {address.defaultBilling && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        <CreditCard className="h-3 w-3" />
                        Default Billing
                      </span>
                    )}
                    {address.defaultShipping && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <Home className="h-3 w-3" />
                        Default Shipping
                      </span>
                    )}
                  </div>
                </div>

                <div className="ml-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface hover:text-ink"
                    aria-label="Edit address"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(address.id)}
                    disabled={deletingId === address.id}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editingAddress ? 'Edit Address' : 'Add Address'}
        side="right"
        className="p-4"
      >
        <div className="space-y-4">
          {fieldErrors.submit && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {fieldErrors.submit}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                First name
              </label>
              <input
                ref={fieldRefs.firstname}
                type="text"
                value={form.firstname}
                onChange={e => {
                  setForm(prev => ({ ...prev, firstname: e.target.value }));
                  if (fieldErrors.firstname) {
                    setFieldErrors(prev => {
                      const { firstname: _, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={inputClass(fieldErrors.firstname)}
                placeholder="John"
                aria-invalid={!!fieldErrors.firstname}
              />
              {fieldErrors.firstname && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.firstname}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Last name
              </label>
              <input
                ref={fieldRefs.lastname}
                type="text"
                value={form.lastname}
                onChange={e => {
                  setForm(prev => ({ ...prev, lastname: e.target.value }));
                  if (fieldErrors.lastname) {
                    setFieldErrors(prev => {
                      const { lastname: _, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={inputClass(fieldErrors.lastname)}
                placeholder="Doe"
                aria-invalid={!!fieldErrors.lastname}
              />
              {fieldErrors.lastname && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.lastname}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Street address
            </label>
            <input
              ref={fieldRefs.street1}
              type="text"
              value={form.street1}
              onChange={e => {
                setForm(prev => ({ ...prev, street1: e.target.value }));
                if (fieldErrors.street1) {
                  setFieldErrors(prev => {
                    const { street1: _, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              className={inputClass(fieldErrors.street1)}
              placeholder="123 Main St"
              aria-invalid={!!fieldErrors.street1}
            />
            {fieldErrors.street1 && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.street1}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Apartment, suite, etc. (optional)
            </label>
            <input
              ref={fieldRefs.street2}
              type="text"
              value={form.street2}
              onChange={e => setForm(prev => ({ ...prev, street2: e.target.value }))}
              className={inputClass()}
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">City</label>
              <input
                ref={fieldRefs.city}
                type="text"
                value={form.city}
                onChange={e => {
                  setForm(prev => ({ ...prev, city: e.target.value }));
                  if (fieldErrors.city) {
                    setFieldErrors(prev => {
                      const { city: _, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={inputClass(fieldErrors.city)}
                placeholder="New York"
                aria-invalid={!!fieldErrors.city}
              />
              {fieldErrors.city && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.city}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                State / Region
              </label>
              {regions.length > 0 ? (
                <Select
                  value={
                    regions.find(r => r.name === form.region || r.code === form.region)?.code ??
                    ''
                  }
                  onValueChange={handleRegionChange}
                  disabled={regionsLoading}
                >
                  <SelectTrigger className={selectTriggerClass(fieldErrors.region)}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r.id} value={r.code}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  ref={fieldRefs.region}
                  type="text"
                  value={form.region}
                  onChange={e => {
                    setForm(prev => ({ ...prev, region: e.target.value }));
                    if (fieldErrors.region) {
                      setFieldErrors(prev => {
                        const { region: _, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  className={inputClass(fieldErrors.region)}
                  placeholder="NY"
                  aria-invalid={!!fieldErrors.region}
                />
              )}
              {fieldErrors.region && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.region}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                ZIP / Postal code
              </label>
              <input
                ref={fieldRefs.postcode}
                type="text"
                value={form.postcode}
                onChange={e => {
                  setForm(prev => ({ ...prev, postcode: e.target.value }));
                  if (fieldErrors.postcode) {
                    setFieldErrors(prev => {
                      const { postcode: _, ...rest } = prev;
                      return rest;
                    });
                  }
                }}
                className={inputClass(fieldErrors.postcode)}
                placeholder="10001"
                aria-invalid={!!fieldErrors.postcode}
              />
              {fieldErrors.postcode && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.postcode}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">
                Country
              </label>
              <Select value={form.country_code} onValueChange={handleCountryChange}>
                <SelectTrigger className={selectTriggerClass(fieldErrors.country_code)}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name_english}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.country_code && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.country_code}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Phone (optional)
            </label>
            <input
              ref={fieldRefs.telephone}
              type="tel"
              value={form.telephone}
              onChange={e => setForm(prev => ({ ...prev, telephone: e.target.value }))}
              className={inputClass()}
              placeholder="+1 555 000 0000"
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="default_billing"
                checked={form.default_billing}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, default_billing: checked === true }))
                }
              />
              <label htmlFor="default_billing" className="text-sm text-ink">
                Set as default billing address
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="default_shipping"
                checked={form.default_shipping}
                onCheckedChange={checked =>
                  setForm(prev => ({ ...prev, default_shipping: checked === true }))
                }
              />
              <label htmlFor="default_shipping" className="text-sm text-ink">
                Set as default shipping address
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSheetOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              className="flex-1"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : editingAddress
                ? 'Update Address'
                : 'Add Address'}
            </Button>
          </div>
        </div>
      </Sheet>
    </AccountScaffold>
  );
}
