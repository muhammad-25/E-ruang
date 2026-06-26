const ReviewModel = require('../models/reviewModel');

function redirectWithMessage(res, roomId, type, message) {
  const key = type === 'success' ? 'reviewSuccess' : 'reviewError';
  return res.redirect(`/room/${roomId}?${key}=${encodeURIComponent(message)}#ulasan`);
}

function formatAdminDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

module.exports = {
  create: async (req, res) => {
    const roomId = req.params.id;
    const userId = req.session.userId;

    try {
      const bookingId = Number.parseInt(req.body.booking_id, 10);
      const rating = Number.parseInt(req.body.rating, 10);
      const comment = String(req.body.comment || '').trim();

      if (!userId) {
        return res.redirect('/login');
      }

      if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
        return redirectWithMessage(res, roomId, 'error', 'Rating dan komentar wajib diisi dengan benar.');
      }

      if (comment.length > 1000) {
        return redirectWithMessage(res, roomId, 'error', 'Komentar maksimal 1000 karakter.');
      }

      const booking = await ReviewModel.getReviewableBooking({ bookingId, roomId, userId });
      if (!booking) {
        return redirectWithMessage(res, roomId, 'error', 'Ulasan hanya dapat diberikan untuk booking Anda yang sudah selesai.');
      }

      await ReviewModel.create({ bookingId, roomId, userId, rating, comment });
      return redirectWithMessage(res, roomId, 'success', 'Terima kasih, ulasan Anda berhasil dikirim.');
    } catch (error) {
      console.error('Error creating room review:', error);
      return redirectWithMessage(res, roomId, 'error', 'Gagal menyimpan ulasan. Silakan coba lagi.');
    }
  },

  adminIndex: async (req, res) => {
    try {
      const rawReviews = await ReviewModel.listAll();
      const reviews = rawReviews.map((review) => ({
        ...review,
        booking_date: `${formatAdminDate(review.start_datetime)} - ${formatAdminDate(review.end_datetime)}`
      }));

      res.render('pages/admin-reviews', {
        layout: 'layouts/admin',
        title: 'Moderasi Ulasan',
        path: '/admin/reviews',
        reviews
      });
    } catch (error) {
      console.error('Error loading admin reviews:', error);
      res.status(500).send('Terjadi kesalahan server saat mengambil data ulasan.');
    }
  },

  updateVisibility: async (req, res) => {
    try {
      const reviewId = Number.parseInt(req.params.id, 10);
      const isVisible = req.body.action === 'show';

      if (!reviewId) {
        return res.redirect('/admin/reviews');
      }

      await ReviewModel.updateVisibility(reviewId, isVisible);
      return res.redirect('/admin/reviews');
    } catch (error) {
      console.error('Error updating review visibility:', error);
      return res.redirect('/admin/reviews');
    }
  },

  delete: async (req, res) => {
    try {
      const reviewId = Number.parseInt(req.params.id, 10);
      if (reviewId) {
        await ReviewModel.delete(reviewId);
      }
      return res.redirect('/admin/reviews');
    } catch (error) {
      console.error('Error deleting review:', error);
      return res.redirect('/admin/reviews');
    }
  }
};
