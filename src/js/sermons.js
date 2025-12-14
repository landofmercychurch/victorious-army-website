// src/js/sermons.js
import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

/** 🧩 OpenGraph/Twitter meta */
function setOpenGraphMeta({ title, description, image, url }) {
  const head = document.head;
  function setMeta(property, content, isName = false) {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let meta = head.querySelector(selector);
    if (!meta) {
      meta = document.createElement("meta");
      if (isName) meta.setAttribute("name", property);
      else meta.setAttribute("property", property);
      head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }

  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:image", image);
  setMeta("og:url", url);
  setMeta("twitter:card", "summary_large_image", true);
  setMeta("twitter:title", title, true);
  setMeta("twitter:description", description, true);
  setMeta("twitter:image", image, true);
}

/** 📱 TIKTOK-STYLE: Sermon Thumbnails with Lazy Loading (NEW) */
export async function initSermonThumbnails(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // 🕒 Latest-first order
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    // Add scroll indicator for TikTok feel
    const scrollIndicator = el("div", "scroll-indicator");
    scrollIndicator.textContent = "⬆️⬇️ Swipe to browse sermons ⬆️⬇️";
    scrollIndicator.style.cssText = `
      text-align: center;
      padding: 10px;
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
    `;
    container.appendChild(scrollIndicator);

    for (const sermon of sermons) {
      const card = el("div", "sermon-tiktok-card");
      card.dataset.id = sermon.id;
      card.style.cssText = `
        position: relative;
        margin-bottom: 20px;
        border-radius: 12px;
        overflow: hidden;
        background: #000;
        min-height: 500px;
        cursor: pointer;
      `;

      // 🔴 LIVE BADGE (if applicable)
      if (sermon.is_live) {
        const liveBadge = el("div", "live-badge");
        liveBadge.innerHTML = "🔴 LIVE";
        liveBadge.style.cssText = `
          position: absolute;
          top: 15px;
          left: 15px;
          background: #ff0000;
          color: white;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          z-index: 2;
        `;
        card.appendChild(liveBadge);
      }

      // 🖼️ THUMBNAIL IMAGE (Click to go to detail page)
      const thumbnailContainer = el("div", "thumbnail-container");
      thumbnailContainer.style.cssText = `
        width: 100%;
        height: 500px;
        position: relative;
        overflow: hidden;
      `;

      const thumbnailImg = el("img", "sermon-thumbnail");
      thumbnailImg.src = sermon.thumbnail_url || "default-thumb.jpg";
      thumbnailImg.alt = sermon.title || "Sermon Thumbnail";
      thumbnailImg.loading = "lazy";
      thumbnailImg.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      `;
      
      // Add hover effect
      thumbnailImg.onmouseenter = () => {
        thumbnailImg.style.transform = "scale(1.05)";
      };
      thumbnailImg.onmouseleave = () => {
        thumbnailImg.style.transform = "scale(1)";
      };

      // PLAY OVERLAY BUTTON
      const playOverlay = el("div", "play-overlay");
      playOverlay.innerHTML = "▶️";
      playOverlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.7);
        color: white;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 1;
      `;
      
      playOverlay.onmouseenter = () => {
        playOverlay.style.background = "rgba(0,0,0,0.9)";
        playOverlay.style.transform = "translate(-50%, -50%) scale(1.1)";
      };
      playOverlay.onmouseleave = () => {
        playOverlay.style.background = "rgba(0,0,0,0.7)";
        playOverlay.style.transform = "translate(-50%, -50%) scale(1)";
      };

      // CLICK HANDLER - Go to detail page
      const goToDetailPage = () => {
        window.location.href = `sermon-detail.html?id=${sermon.id}`;
      };
      
      thumbnailContainer.onclick = goToDetailPage;
      playOverlay.onclick = (e) => {
        e.stopPropagation();
        goToDetailPage();
      };

      thumbnailContainer.appendChild(thumbnailImg);
      thumbnailContainer.appendChild(playOverlay);
      card.appendChild(thumbnailContainer);

      // 📝 CONTENT OVERLAY (Bottom of thumbnail)
      const contentOverlay = el("div", "content-overlay");
      contentOverlay.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.9));
        color: white;
        padding: 20px;
        z-index: 1;
      `;

      // Title with SEO-friendly link
      const titleLink = el("a", "sermon-title-link");
      titleLink.href = `sermon-detail.html?id=${sermon.id}`;
      titleLink.style.cssText = `
        color: white;
        text-decoration: none;
        display: block;
        margin-bottom: 8px;
      `;
      titleLink.innerHTML = `<h3 style="margin: 0; font-size: 18px;">${sermon.title || "Untitled Sermon"}</h3>`;
      contentOverlay.appendChild(titleLink);

      // Meta info
      const metaInfo = el("div", "meta-info");
      metaInfo.style.cssText = `
        display: flex;
        gap: 15px;
        font-size: 12px;
        color: #ccc;
        margin-bottom: 8px;
      `;
      
      const date = new Date(sermon.created_at);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      metaInfo.innerHTML = `
        <span>📅 ${formattedDate}</span>
        <span>🕒 ${formattedTime}</span>
        ${sermon.speaker ? `<span>👤 ${sermon.speaker}</span>` : ''}
      `;
      contentOverlay.appendChild(metaInfo);

      // Description preview
      if (sermon.description) {
        const descPreview = el("p", "desc-preview");
        descPreview.style.cssText = `
          margin: 0;
          font-size: 14px;
          color: #eee;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        `;
        descPreview.textContent = sermon.description;
        contentOverlay.appendChild(descPreview);
      }

      // QUICK ACTIONS (Right side overlay - TikTok style)
      const quickActions = el("div", "quick-actions-tiktok");
      quickActions.style.cssText = `
        position: absolute;
        right: 15px;
        bottom: 100px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        align-items: center;
        z-index: 2;
      `;

      // Fetch counts
      let likeCount = 0;
      let commentCount = 0;
      
      try {
        const likesRes = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
        likeCount = likesRes.count || 0;
        
        const comments = await fetchSermonComments(String(sermon.id));
        commentCount = Array.isArray(comments) ? comments.length : 0;
      } catch (err) {
        console.warn("Could not load counts for sermon:", sermon.id);
      }

      // Action buttons
      const actionButtons = [
        { icon: "❤️", count: likeCount, action: "like", color: "#ff2d55" },
        { icon: "💬", count: commentCount, action: "comment", color: "#007aff" },
        { icon: "🔗", count: 0, action: "share", color: "#34c759" },
        { icon: "📥", count: 0, action: "save", color: "#5856d6" }
      ];

      actionButtons.forEach(btn => {
        const actionBtn = el("div", "tiktok-action");
        actionBtn.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        `;
        
        const iconSpan = el("span", "action-icon");
        iconSpan.textContent = btn.icon;
        iconSpan.style.cssText = `
          font-size: 24px;
          margin-bottom: 5px;
          transition: transform 0.2s ease;
        `;
        
        const countSpan = el("span", "action-count");
        countSpan.textContent = btn.count > 0 ? abbreviateNumber(btn.count) : "";
        countSpan.style.cssText = `
          font-size: 11px;
          color: white;
          font-weight: bold;
        `;
        
        // Hover effects
        actionBtn.onmouseenter = () => {
          iconSpan.style.transform = "scale(1.2)";
        };
        actionBtn.onmouseleave = () => {
          iconSpan.style.transform = "scale(1)";
        };
        
        // Click actions
        actionBtn.onclick = async (e) => {
          e.stopPropagation();
          
          switch(btn.action) {
            case 'like':
              await api.post("/likes", { sermon_id: sermon.id });
              likeCount++;
              countSpan.textContent = abbreviateNumber(likeCount);
              iconSpan.style.color = btn.color;
              break;
              
            case 'comment':
              // Show quick comment modal
              showQuickComment(sermon.id, card);
              break;
              
            case 'share':
              shareSermonTikTok(sermon);
              break;
              
            case 'save':
              // Save functionality
              if (navigator.share) {
                navigator.share({
                  title: sermon.title,
                  text: sermon.description,
                  url: `sermon-detail.html?id=${sermon.id}`
                });
              }
              break;
          }
        };
        
        actionBtn.appendChild(iconSpan);
        actionBtn.appendChild(countSpan);
        quickActions.appendChild(actionBtn);
      });

      card.appendChild(contentOverlay);
      card.appendChild(quickActions);

      // 🔗 SHARE BUTTON (Bottom right)
      const shareBtn = el("button", "share-btn-bottom");
      shareBtn.innerHTML = "🔗 Share This Sermon";
      shareBtn.style.cssText = `
        position: absolute;
        bottom: 15px;
        right: 15px;
        background: rgba(255,255,255,0.9);
        color: #000;
        border: none;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        z-index: 2;
        transition: all 0.3s ease;
      `;
      
      shareBtn.onmouseenter = () => {
        shareBtn.style.background = "white";
        shareBtn.style.transform = "scale(1.05)";
      };
      shareBtn.onmouseleave = () => {
        shareBtn.style.background = "rgba(255,255,255,0.9)";
        shareBtn.style.transform = "scale(1)";
      };
      
      shareBtn.onclick = (e) => {
        e.stopPropagation();
        shareSermonTikTok(sermon);
      };
      card.appendChild(shareBtn);

      container.appendChild(card);
    }

    // Add lazy loading for images
    const lazyLoadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target.querySelector('img');
            if (img && img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            lazyLoadObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all cards for lazy loading
    document.querySelectorAll('.sermon-tiktok-card').forEach(card => {
      lazyLoadObserver.observe(card);
    });

    // Handle deep linking
    const params = new URLSearchParams(window.location.search);
    const sermonId = params.get("sermon");
    if (sermonId) {
      setTimeout(() => {
        const targetCard = container.querySelector(`.sermon-tiktok-card[data-id="${sermonId}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          targetCard.style.boxShadow = "0 0 0 3px #4CAF50";
          targetCard.style.transition = "box-shadow 0.3s ease";
        }
      }, 100);
    }

  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red; padding: 20px; text-align: center;">Failed to load sermons. Please try again later.</p>`;
  }
}

/** 🎥 ORIGINAL FUNCTION: Full Video Player (KEPT INTACT) */
export async function initSermons(container) {
  // YOUR EXISTING CODE REMAINS EXACTLY THE SAME
  // I'M NOT TOUCHING THIS AT ALL
  // Just copying your original function here...
  
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // 🕒 Latest-first order
    sermons.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    /** Scroll hint */
    const scrollIndicator = el("div", "scroll-indicator");
    scrollIndicator.textContent = "⬆️⬇️ Swipe up/down to see more sermons ⬆️⬇️";
    container.appendChild(scrollIndicator);

    const videos = [];

    for (const sermon of sermons) {
      const card = el("div", "sermon-card");
      card.dataset.id = sermon.id;

      /** 🎞 Video wrapper */
      const videoWrapper = el("div", "video-wrapper");
      const video = el("video");
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.style.backgroundColor = "#000";
      videoWrapper.appendChild(video);
      card.appendChild(videoWrapper);

      videos.push({ video, sermon });

      /** Lazy-load HLS or fallback */
      const setupVideo = () => {
        const urls = sermon.urls || {};
        if (urls.hls_url && window.Hls && Hls.isSupported()) {
          const hls = new Hls({ startLevel: -1, maxBufferLength: 30 });
          hls.loadSource(urls.hls_url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        } else if (urls.hls_url && video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = urls.hls_url;
        } else {
          video.src = urls.mp4_url || urls.webm_url || sermon.video_url || "";
        }
      };

      const lazyObserver = new IntersectionObserver(
        entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              setupVideo();
              lazyObserver.unobserve(video);
            }
          });
        },
        { threshold: 0.25, root: container }
      );
      lazyObserver.observe(video);

      /** Overlay details */
      const overlay = el("div", "sermon-overlay");
      overlay.innerHTML = `
        <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
        <div class="sermon-desc">${sermon.description || ""}</div>
      `;
      card.appendChild(overlay);

      /** Buttons (like, comment, share) */
      const actions = el("div", "sermon-actions");
      actions.innerHTML = `
        <button class="like-btn">❤️</button>
        <span class="like-count">0 Likes</span>
        <button class="comment-btn">💬</button>
        <span class="comment-count">0 Comments</span>
        <button class="share-btn">🔗 Share</button>
      `;
      card.appendChild(actions);

      /** YouTube button */
      if (sermon.youtube_url) {
        const ytBtn = el("a", "youtube-btn");
        ytBtn.href = sermon.youtube_url;
        ytBtn.target = "_blank";
        ytBtn.rel = "noopener noreferrer";
        ytBtn.innerHTML = "📺 Full Sermon";
        card.appendChild(ytBtn);
      }

      /** ❤️ Likes */
      const likeBtn = actions.querySelector(".like-btn");
      const likeCountEl = actions.querySelector(".like-count");
      async function refreshLikes() {
        try {
          const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
          likeCountEl.textContent = `${res.count || 0} Likes`;
        } catch {
          likeCountEl.textContent = "0 Likes";
        }
      }
      likeBtn.addEventListener("click", async () => {
        await api.post("/likes", { sermon_id: sermon.id });
        refreshLikes();
      });
      refreshLikes();

      /** 💬 Comments */
      const commentBtn = actions.querySelector(".comment-btn");
      const commentCountEl = actions.querySelector(".comment-count");
      const commentsBox = el("div", "comments-box");
      commentsBox.style.display = "none";
      card.appendChild(commentsBox);

      async function refreshComments() {
        try {
          let comments = await fetchSermonComments(String(sermon.id));
          if (!Array.isArray(comments)) comments = [];
          commentCountEl.textContent = `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`;

          let commentList = commentsBox.querySelector(".comment-list");
          if (!commentList) {
            commentsBox.innerHTML = `
              <div class="comments-header">
                <strong>${comments.length} Comment${comments.length !== 1 ? "s" : ""}</strong>
                <button class="close-btn">✖</button>
              </div>
              <div class="comment-list"></div>
              <form class="comment-form">
                <input type="text" class="comment-name" placeholder="Your name (optional)" />
                <textarea class="comment-content" placeholder="Write your comment..." required></textarea>
                <button type="submit">Post Comment</button>
              </form>
            `;
            commentList = commentsBox.querySelector(".comment-list");

            commentsBox.querySelector(".close-btn").onclick = () => {
              commentsBox.style.display = "none";
              video.play().catch(() => {});
            };

            commentsBox.querySelector(".comment-form").onsubmit = async e => {
              e.preventDefault();
              const name = commentsBox.querySelector(".comment-name").value.trim() || "Guest";
              const content = commentsBox.querySelector(".comment-content").value.trim();
              if (!content) return;
              const newComment = await postSermonComment({ sermon_id: sermon.id, name, content });
              commentList.insertAdjacentHTML(
                "afterbegin",
                `<div class="comment"><b>${newComment.name || "Guest"}:</b> <span>${newComment.content}</span><div class="comment-time">${new Date(
                  newComment.created_at
                ).toLocaleString()}</div></div>`
              );
              e.target.reset();
              commentCountEl.textContent = `${commentList.children.length} Comment${commentList.children.length !== 1 ? "s" : ""}`;
            };
          }

          commentList.innerHTML = comments.length
            ? comments
                .map(
                  c =>
                    `<div class="comment"><b>${c.name || "Guest"}:</b> <span>${c.content}</span><div class="comment-time">${new Date(
                      c.created_at
                    ).toLocaleString()}</div></div>`
                )
                .join("")
            : `<p class="no-comments">No comments yet. Be the first!</p>`;
        } catch (err) {
          console.error("Failed to load comments", err);
        }
      }

      commentBtn.addEventListener("click", () => {
        const hidden = commentsBox.style.display === "none";
        commentsBox.style.display = hidden ? "block" : "none";
        if (hidden) {
          video.pause();
          refreshComments();
        } else {
          video.play().catch(() => {});
        }
      });

      container.appendChild(card);
    }

  /** 🎬 Auto-play only when visible on screen */
const autoPlayObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const vid = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
        // Pause all other videos
        videos.forEach((v) => {
          if (v.video !== vid) v.video.pause();
        });
        // Play the one currently visible
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  },
  { threshold: 0.7, root: null } // Use viewport
);

// Observe all videos
videos.forEach((vObj) => autoPlayObserver.observe(vObj.video));

/** 🎬 Pause ALL videos when user leaves the sermon feed */
window.addEventListener("scroll", () => {
  const rect = container.getBoundingClientRect();
  const fullyOutOfView = rect.bottom < 0 || rect.top > window.innerHeight;

  if (fullyOutOfView) {
    videos.forEach((v) => v.video.pause());
  }
});

/** 🔀 TRUE SHUFFLE autoplay */
let unplayed = [...videos];
function playNextShuffle(currentVideo) {
  if (videos.length <= 1) return;

  unplayed = unplayed.filter((v) => v.video !== currentVideo);

  if (unplayed.length === 0) unplayed = [...videos];

  const next = unplayed[Math.floor(Math.random() * unplayed.length)];

  next.video.scrollIntoView({ behavior: "smooth", block: "center" });
  next.video.play().catch(() => {});
}

videos.forEach((vObj) => {
  vObj.video.addEventListener("ended", () => playNextShuffle(vObj.video));
});


    /** Handle deep link */
    const sermonId = new URLSearchParams(window.location.search).get("sermon");
    if (sermonId) {
      const targetCard = container.querySelector(`.sermon-card[data-id="${sermonId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
        const video = targetCard.querySelector("video");
        if (video) video.play().catch(() => {});
      }
    }

  } catch (err) {
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red;">Failed to load sermons</p>`;
  }
}

/** 🔧 HELPER FUNCTIONS */
function abbreviateNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function shareSermonTikTok(sermon) {
  const shareUrl = `${window.location.origin}/sermon-detail.html?id=${sermon.id}`;
  const shareText = `Watch: ${sermon.title}`;
  
  if (navigator.share) {
    navigator.share({
      title: sermon.title,
      text: sermon.description || shareText,
      url: shareUrl
    });
  } else {
    // Fallback for desktop
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  }
}

function showQuickComment(sermonId, card) {
  // Create quick comment modal
  const modal = el("div", "quick-comment-modal");
  modal.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0,0,0,0.95);
    color: white;
    padding: 20px;
    z-index: 1000;
    border-radius: 20px 20px 0 0;
  `;
  
  modal.innerHTML = `
    <h4 style="margin: 0 0 15px 0;">Add a comment</h4>
    <textarea placeholder="Write your comment..." style="width: 100%; padding: 10px; border-radius: 8px; margin-bottom: 10px;"></textarea>
    <div style="display: flex; gap: 10px;">
      <button class="cancel-btn" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 8px;">Cancel</button>
      <button class="submit-btn" style="flex: 1; padding: 10px; background: #007aff; color: white; border: none; border-radius: 8px;">Post</button>
    </div>
  `;
  
  card.appendChild(modal);
  
  // Handle cancel
  modal.querySelector('.cancel-btn').onclick = () => {
    card.removeChild(modal);
  };
  
  // Handle submit
  modal.querySelector('.submit-btn').onclick = async () => {
    const textarea = modal.querySelector('textarea');
    const content = textarea.value.trim();
    
    if (content) {
      try {
        await postSermonComment({ 
          sermon_id: sermonId, 
          name: "Guest", 
          content 
        });
        
        // Update comment count
        const commentCountSpan = card.querySelector('.action-count');
        const currentCount = parseInt(commentCountSpan.textContent) || 0;
        commentCountSpan.textContent = abbreviateNumber(currentCount + 1);
        
        card.removeChild(modal);
      } catch (error) {
        console.error('Error posting comment:', error);
        alert('Failed to post comment');
      }
    }
  };
}

/** 📱 MOBILE-FIRST CSS INJECTION */
function injectTikTokStyles() {
  if (document.querySelector('#tiktok-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'tiktok-styles';
  style.textContent = `
    .sermon-tiktok-card {
      position: relative;
      margin-bottom: 20px;
      border-radius: 12px;
      overflow: hidden;
      background: #000;
      min-height: 500px;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    
    .sermon-tiktok-card:hover {
      transform: translateY(-5px);
    }
    
    .thumbnail-container {
      width: 100%;
      height: 500px;
      position: relative;
      overflow: hidden;
    }
    
    .sermon-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .play-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.7);
      color: white;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 1;
    }
    
    .play-overlay:hover {
      background: rgba(0,0,0,0.9);
      transform: translate(-50%, -50%) scale(1.1);
    }
    
    .content-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.9));
      color: white;
      padding: 20px;
      z-index: 1;
    }
    
    .sermon-title-link {
      color: white;
      text-decoration: none;
      display: block;
      margin-bottom: 8px;
    }
    
    .sermon-title-link h3 {
      margin: 0;
      font-size: 18px;
    }
    
    .meta-info {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #ccc;
      margin-bottom: 8px;
    }
    
    .desc-preview {
      margin: 0;
      font-size: 14px;
      color: #eee;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .quick-actions-tiktok {
      position: absolute;
      right: 15px;
      bottom: 100px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
      z-index: 2;
    }
    
    .tiktok-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .action-icon {
      font-size: 24px;
      margin-bottom: 5px;
      transition: transform 0.2s ease;
    }
    
    .action-count {
      font-size: 11px;
      color: white;
      font-weight: bold;
    }
    
    .tiktok-action:hover .action-icon {
      transform: scale(1.2);
    }
    
    .share-btn-bottom {
      position: absolute;
      bottom: 15px;
      right: 15px;
      background: rgba(255,255,255,0.9);
      color: #000;
      border: none;
      padding: 8px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      z-index: 2;
      transition: all 0.3s ease;
    }
    
    .share-btn-bottom:hover {
      background: white;
      transform: scale(1.05);
    }
    
    .live-badge {
      position: absolute;
      top: 15px;
      left: 15px;
      background: #ff0000;
      color: white;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 2;
    }
    
    @media (max-width: 768px) {
      .sermon-tiktok-card {
        min-height: 400px;
      }
      
      .thumbnail-container {
        height: 400px;
      }
      
      .quick-actions-tiktok {
        bottom: 80px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Inject styles when module loads
injectTikTokStyles();