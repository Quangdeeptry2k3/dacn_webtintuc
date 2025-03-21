document.addEventListener('DOMContentLoaded', function () {
  // Xử lý sự kiện "Lưu bài viết"
  const saveButtons = document.querySelectorAll('.save-news-btn');
  saveButtons.forEach(button => {
    button.addEventListener('click', function () {
      const newsId = button.getAttribute('data-news-id');
      saveNews(newsId);
    });
  });

  // Thêm sự kiện cho các nút "Xóa"
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
      const newsId = event.target.getAttribute('data-news-id');
      await confirmDelete(newsId);
    });
  });
});

// Hàm lưu bài viết
function saveNews(newsId) {
  fetch('/news/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newsId })
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
      } else {
        alert('Đã xảy ra lỗi khi lưu bài viết.');
      }
    })
    .catch(error => {
      console.error('Lỗi khi lưu bài viết:', error);
      alert('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    });
}

// Hàm xác nhận và xóa bài viết
async function confirmDelete(newsId) {
  if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
    try {
      const response = await fetch(`/saved/delete/${newsId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('Bài viết đã được xóa');
        const articleElement = document.getElementById(`article-${newsId}`);
        if (articleElement) {
          articleElement.remove();  // Xóa bài viết khỏi giao diện
        }
      } else {
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  }
}
