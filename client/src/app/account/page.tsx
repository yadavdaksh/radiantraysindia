"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { placeholderStore, Address } from "@/lib/placeholder-store";
import { products as mockProducts } from "@/lib/site-data";
import { User, MapPin, Heart, Shield, PlusCircle, Trash2, ShoppingCart, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, updateProfile, logout } = useAuth();
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  // Active Tab
  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [label, setLabel] = useState("Home");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("India");

  // Edit Profile Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);

  // Wishlist Products State
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!customer) {
      router.push("/login?redirect=/account");
      return;
    }

    // Load Addresses
    setAddresses(placeholderStore.getAddresses());

    // Load Form Values
    setName(customer.name);
    setPhone(customer.phone || "");
  }, [customer, router]);

  // Load wishlist products
  useEffect(() => {
    async function loadWishlistProducts() {
      if (wishlist.length === 0) {
        setWishlistProducts([]);
        return;
      }
      try {
        const res = await apiClient.get("/public/products");
        const all = res.data.data;
        const filtered = all.filter((p: any) => wishlist.includes(p.slug) || wishlist.includes(p.id));
        setWishlistProducts(filtered);
      } catch (err) {
        console.warn("Using mock catalog for wishlist products:", err);
        const filteredMock = mockProducts.filter((p) => wishlist.includes(p.slug));
        const mapped = filteredMock.map((p) => ({
          name: p.name,
          slug: p.slug,
          productType: p.type,
          shortDescription: p.summary,
          basePrice: p.type === "B2C" ? 12500 : null,
        }));
        setWishlistProducts(mapped);
      }
    }
    loadWishlistProducts();
  }, [wishlist]);

  if (!customer) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile({ name, phone });
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine1 || !city || !state || !postalCode) return;

    placeholderStore.saveAddress({
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault: false,
    });

    setAddresses(placeholderStore.getAddresses());
    setShowAddAddress(false);
    setLabel("Home");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      placeholderStore.deleteAddress(id);
      setAddresses(placeholderStore.getAddresses());
    }
  };

  const handleMoveToCart = (prod: any) => {
    addToCart(prod, null, 1);
    toggleWishlist(prod.slug || prod.id);
    alert("Moved to cart!");
  };

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters.");
      return;
    }
    setSecurityLoading(true);
    // Simulate security change
    setTimeout(() => {
      setSecurityLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      alert("Password changed successfully!");
    }, 1500);
  };

  return (
    <SiteShell
      title="Customer Account Dashboard"
      subtitle="Edit your business coordinates, check order timelines, and manage your wishlist."
    >
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] my-6">
        {/* Sidebar Tabs */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 h-fit space-y-1 shadow-sm">
          {[
            { id: "profile", label: "My Profile", icon: User },
            { id: "orders_link", label: "Order History", icon: ArrowRight, action: () => router.push("/account/orders") },
            { id: "addresses", label: "Address Book", icon: MapPin },
            { id: "wishlist", label: "My Wishlist", icon: Heart },
            { id: "security", label: "Security & Pass", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isLink = tab.id === "orders_link";
            return (
              <button
                key={tab.id}
                onClick={isLink ? tab.action : () => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition duration-150 ${activeTab === tab.id
                    ? "bg-brand/5 text-brand"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Dashboard Area */}
        <section className="space-y-6">

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">My Profile Details</h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={customer.email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-brand px-6 py-3 text-xs font-bold text-white shadow hover:bg-brand-dark transition disabled:opacity-75"
                >
                  {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </form>
            </div>
          )}

          {/* ADDRESS BOOK TAB */}
          {activeTab === "addresses" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Address Coordinates Book</h3>
                {!showAddAddress && (
                  <button
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Address
                  </button>
                )}
              </div>

              {!showAddAddress ? (
                addresses.length === 0 ? (
                  <p className="text-xs italic text-slate-400">No saved addresses found. Add one to speed up checkout.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="rounded-2xl border border-slate-200 p-4 space-y-3 relative flex flex-col justify-between"
                      >
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold text-slate-900 uppercase bg-slate-100 px-1.5 py-0.5 rounded text-[8px] mr-1.5">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="font-bold text-brand uppercase bg-brand/10 px-1.5 py-0.5 rounded text-[8px]">
                              Default
                            </span>
                          )}
                          <p className="text-slate-800 pt-2 font-medium">
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                          </p>
                          <p className="text-slate-500">
                            {addr.city}, {addr.state} - {addr.postalCode}
                          </p>
                          <p className="text-slate-400">{addr.country}</p>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-slate-400 hover:text-red-600 flex items-center gap-1 text-[10px] font-bold transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Add Address form */
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="flex items-center justify-between pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">New Coordinate Details</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddAddress(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Label (Home, Office)</label>
                      <input
                        type="text"
                        required
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">City *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Postal Pin Code *</label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-white shadow"
                  >
                    Save Address
                  </button>
                </form>
              )}
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === "wishlist" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">My Saved Wishlist ({wishlistProducts.length})</h3>

              {wishlistProducts.length === 0 ? (
                <p className="text-xs italic text-slate-400">Your wishlist is empty. Browse products and add items to save them.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {wishlistProducts.map((prod) => {
                    const isB2C = prod.productType === "B2C";
                    return (
                      <div key={prod.slug} className="py-4 flex items-center justify-between gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-950">{prod.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{prod.shortDescription || "Cleanroom system solution."}</p>
                          <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-[8px] font-bold ${isB2C ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                            {isB2C ? "B2C Store" : "B2B Quote"}
                          </span>
                        </div>

                        <div className="flex gap-2 items-center">
                          {isB2C ? (
                            <button
                              onClick={() => handleMoveToCart(prod)}
                              className="flex items-center gap-1 bg-brand text-white text-[10px] font-bold px-3 py-2 rounded-lg hover:bg-brand-dark transition"
                            >
                              <ShoppingCart className="h-3 w-3" /> Move to Cart
                            </button>
                          ) : (
                            <Link
                              href={`/products/${prod.slug}`}
                              className="bg-slate-900 text-white text-[10px] font-bold px-3.5 py-2 rounded-lg hover:bg-slate-800"
                            >
                              Request Spec
                            </Link>
                          )}
                          <button
                            onClick={() => toggleWishlist(prod.slug || prod.id)}
                            className="text-slate-400 hover:text-rose-600 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Update Account Password</h3>

              <form onSubmit={handleSecurityUpdate} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand focus:ring-1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:border-brand focus:ring-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={securityLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-75"
                >
                  {securityLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Change Password
                </button>
              </form>
            </div>
          )}

        </section>
      </div>
    </SiteShell>
  );
}
