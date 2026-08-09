export const ADMIN_ACTION_LABELS: Record<string, string> = {
  adminLogin: 'ورود مدیر', adminLogout: 'خروج مدیر',
  createProduct: 'ایجاد محصول', updateProduct: 'ویرایش محصول', deleteProduct: 'حذف محصول',
  permanentlyDeleteProduct: 'حذف دائمی محصول', reactivateProduct: 'فعال‌سازی مجدد محصول',
  bulkUpdateProducts: 'ویرایش گروهی محصولات', uploadProductImage: 'بارگذاری تصویر محصول',
  updateOrderStatusAdmin: 'تغییر وضعیت سفارش', updateOrderAdmin: 'ویرایش سفارش',
  updateUser: 'ویرایش کاربر', setUserActive: 'تغییر وضعیت کاربر', updateUserRole: 'تغییر نقش کاربر',
  createDiscountCode: 'ایجاد کد تخفیف', updateDiscountCode: 'ویرایش کد تخفیف',
  deleteDiscountCode: 'حذف کد تخفیف', setDiscountCodeActive: 'تغییر وضعیت کد تخفیف',
  sendMarketingSms: 'ارسال پیامک گروهی', updateSiteSettings: 'ویرایش تنظیمات سایت',
  updateSystemSettings: 'ویرایش تنظیمات سیستم', forceSyncHesabfa: 'همگام‌سازی حسابفا',
  registerHesabfaWebhook: 'ثبت وب‌هوک حسابفا', updateRulesContent: 'ویرایش قوانین',
  createPost: 'ایجاد مقاله', updatePost: 'ویرایش مقاله', deletePost: 'حذف مقاله',
  setPostPublished: 'تغییر انتشار مقاله', uploadAdminImage: 'بارگذاری فایل مدیریتی',
};

export function adminActionLabel(action: string): string {
  if (ADMIN_ACTION_LABELS[action]) return ADMIN_ACTION_LABELS[action];
  const spaced = action.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
