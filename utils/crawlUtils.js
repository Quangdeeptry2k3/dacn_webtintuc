const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const url = require('url');
const https = require('https');
const http = require('http');
const mysql = require('mysql2');
const fs = require('fs');

// Kết nối MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2003',
  database: 'web_tin_tuc'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + connection.threadId);
});

// Hàm delay để giảm tốc độ gửi yêu cầu
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm kiểm tra nếu bài viết đã có trong CSDL
const isDuplicate = async (link) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM news WHERE link = ?', [link], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results.length > 0);
    });
  });
};

// Hàm tải ảnh và lưu vào thư mục
const downloadImage = async (imageUrl, imageName) => {
  try {
    if (imageUrl.startsWith('data:image/')) {
      console.log(`Skipping base64 image: ${imageUrl}`);
      return '';
    }
    imageName = imageName.replace(/[<>:"\/\\|?*]/g, '_');

    if (!imageUrl.startsWith('http')) {
      imageUrl = url.resolve('https://vnexpress.net', imageUrl);
    }

    const protocol = imageUrl.startsWith('https:') ? https : http;
    const filePath = path.join(__dirname, '..', 'public', 'images', imageName);

    if (fs.existsSync(filePath)) return `/images/${imageName}`;

    return new Promise((resolve, reject) => {
      protocol.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          console.error(`Failed to download image: ${imageUrl} - Status: ${response.statusCode}`);
          return resolve(''); // Trả về chuỗi rỗng nếu tải ảnh thất bại
        }
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => resolve(`/images/${imageName}`));
        fileStream.on('error', reject);
      }).on('error', reject);
    });
  } catch (err) {
    console.error(`Error downloading image: ${imageUrl}`, err);
    return '';
  }
};

// Hàm fetch với cơ chế retry
const fetchWithRetry = async (url, retries = 3, timeout = 20000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, { timeout });
      return response;
    } catch (error) {
      if (attempt === retries) {
        console.error(`Failed to fetch ${url} after ${retries} attempts`);
        throw error;
      }
      console.warn(`Retrying (${attempt}/${retries})...`);
      await delay(1000); // Chờ 1 giây trước khi retry
    }
  }
};

// Hàm lấy chi tiết bài viết
const fetchArticleDetails = async (articleUrl) => {
  try {
    const articleResponse = await fetchWithRetry(articleUrl);
    if (articleResponse.status !== 200) {
      console.error(`Failed to fetch article. Status: ${articleResponse.status}`);
      return { description: "No description available.", image: '', caption: '', content: '', structure: '' };
    }

    const $ = cheerio.load(articleResponse.data);
    const description = $('meta[name="description"]').attr('content') || "No description available.";
    const figureElements = $('figure');
    const validImages = [];

    figureElements.each((index, element) => {
      const imgSrc = $(element).find('img').attr('src');
      const caption = $(element).find('figcaption').text().trim();

      if (imgSrc && caption && !imgSrc.startsWith('data:image/')) {
        const imageName = path.basename(imgSrc);
        validImages.push({ imgSrc, caption, imageName });
      }
    });

    let image = '';
    if (validImages.length > 0) {
      const firstValidImage = validImages[0];
      image = await downloadImage(firstValidImage.imgSrc, firstValidImage.imageName);
    }

    const content = $('article').text().trim() || 'No content available.';
    const structure = $('article').html() || 'No structure available.';

    return { description, image, caption: validImages.length > 0 ? validImages[0].caption : '', content, structure };
  } catch (err) {
    console.error(`Error fetching article details: ${articleUrl}`, err.message);
    return { description: "No description available.", image: '', caption: '', content: '', structure: '' };
  }
};

// Hàm crawl tin tức
exports.fetchNews = async (page = 1, category = '') => {
  const baseUrl = "https://vnexpress.net";
  const categories = ['giai-tri', 'giao-duc', 'suc-khoe', 'the-thao', 'phap-luat'];
  const maxArticles = 45;
  const newsData = [];

  for (const cat of categories) {
    if (category && category !== cat) continue;

    const categoryUrl = `${baseUrl}/${cat}`;
    console.log(`Crawling category: ${cat}`);

    let response;
    try {
      // Sử dụng fetchWithRetry cho trang danh mục
      response = await fetchWithRetry(categoryUrl);
      if (response.status !== 200) {
        console.error(`Failed to fetch category page: ${cat}. Status: ${response.status}`);
        continue;
      }

      const $ = cheerio.load(response.data);
      const tasks = $(".title-news a").map(async (index, element) => {
        if (newsData.length >= maxArticles) return;

        const title = $(element).text().trim();
        const link = url.resolve(baseUrl, $(element).attr("href"));
        const imageSrc = $(element).find("img").attr("src");

        if (!title || await isDuplicate(link)) return;

        let image = '';
        if (imageSrc) {
          const imageName = path.basename(imageSrc);
          image = await downloadImage(imageSrc, imageName);
        }

        const { description, image: articleImage, caption, content, structure } = await fetchArticleDetails(link);
        if (articleImage) {
          connection.query(
            'INSERT INTO news (title, link, image, description, caption, category, content, structure) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, link, articleImage, description, caption, cat, content, structure],
            (err, results) => {
              if (err) {
                console.error('Error saving article to database:', err);
              } else {
                console.log(`Article saved: ${title} in category ${cat}`);
              }
            }
          );
          newsData.push({ title, link, image: articleImage, description, caption, content, structure });
        }

        // Tăng thời gian chờ giữa các yêu cầu để tránh quá tải server
        await delay(1000);
      }).get();

      await Promise.all(tasks);

    } catch (err) {
      console.error(`Error crawling news for category: ${cat}`, err.message);
      // Nếu có lỗi, không bỏ qua mà tiếp tục crawl các danh mục khác
    }
  }

  const totalArticles = newsData.length;
  const totalPages = Math.ceil(totalArticles / 9);
  const currentPageData = newsData.slice((page - 1) * 9, page * 9);

  return { currentPageData, totalArticles, totalPages };
};
