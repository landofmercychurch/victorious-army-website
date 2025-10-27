import { api } from "./api.js";
import { el } from "./utils.js";
import { fetchSermonComments, postSermonComment } from "./commentsPublic.js";

export async function initSermons(container) {
  if (!container) return;
  container.innerHTML = "<p>Loading sermons…</p>";

  try {
    const sermons = await api.get("/sermons");
    if (!Array.isArray(sermons) || sermons.length === 0) {
      container.innerHTML = "<p>No sermons available.</p>";
      return;
    }

    // Sort by newest
    sermons.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = "";

    const scrollIndicator = el("div", "scroll-indicator");
    scrollIndicator.textContent = "⬆️⬇️ Swipe up/down to see more sermons ⬆️⬇️";
    container.appendChild(scrollIndicator);

    for (const sermon of sermons) {
      const card = el("div", "sermon-card");
      card.dataset.id = sermon.id;

      // Video wrapper
      const videoWrapper = el("div", "video-wrapper");
      const video = el("video");
      video.playsInline = true;
      video.controls = true;
      video.preload = "metadata";
      video.poster = sermon.thumbnail_url || "";
      video.style.backgroundColor = "#000";
      videoWrapper.appendChild(video);
      card.appendChild(videoWrapper);

      // Lazy-load + HLS
      const setupVideo = () => {
        if (sermon.hls_url) {
          if (window.Hls && Hls.isSupported()) {
            const hls = new Hls({ startLevel:-1, maxBufferLength:30 });
            hls.loadSource(sermon.hls_url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sermon.hls_url;
          } else {
            video.src = sermon.video_url || "";
          }
        } else {
          video.src = sermon.video_url || "";
        }
      };
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setupVideo();
            observer.unobserve(video);
          }
        });
      }, { threshold: 0.25, root: container });
      observer.observe(video);

      // Overlay
      const overlay = el("div", "sermon-overlay");
      overlay.innerHTML = `
        <div class="sermon-title">${sermon.title || "Untitled Sermon"}</div>
        <div class="sermon-desc">${sermon.description || ""}</div>
      `;
      card.appendChild(overlay);

      // Actions
      const actions = el("div", "sermon-actions");
      actions.innerHTML = `
        <button class="like-btn">❤️</button>
        <span class="like-count">0 Likes</span>
        <button class="comment-btn">💬</button>
        <span class="comment-count">0 Comments</span>
        <button class="share-btn">🔗 Share</button>
      `;
      card.appendChild(actions);

      // YouTube full video
      if (sermon.youtube_url) {
        const ytBtn = el("a", "youtube-btn");
        ytBtn.href = sermon.youtube_url;
        ytBtn.target = "_blank";
        ytBtn.rel = "noopener noreferrer";
        ytBtn.innerHTML = "📺 Full Sermon";
        card.appendChild(ytBtn);
      }

      // Likes
      const likeBtn = actions.querySelector(".like-btn");
      const likeCountEl = actions.querySelector(".like-count");
      async function refreshLikes() {
        try {
          const res = await api.get(`/likes/count?type=sermon&sermon_id=${sermon.id}`);
          likeCountEl.textContent = `${res.count||0} Likes`;
        } catch { likeCountEl.textContent = "0 Likes"; }
      }
      likeBtn.addEventListener("click", async () => { await api.post("/likes",{sermon_id:sermon.id}); refreshLikes(); });
      refreshLikes();

      // Comments
      const commentBtn = actions.querySelector(".comment-btn");
      const commentCountEl = actions.querySelector(".comment-count");
      const commentsBox = el("div","comments-box");
      commentsBox.style.display = "none";
      card.appendChild(commentsBox);

      async function refreshComments(){
        try{
          let comments = await fetchSermonComments(String(sermon.id));
          if(!Array.isArray(comments)) comments=[];
          commentCountEl.textContent = `${comments.length} Comment${comments.length!==1?'s':''}`;
          let commentList = commentsBox.querySelector(".comment-list");
          if(!commentList){
            commentsBox.innerHTML=`
              <div class="comments-header">
                <strong>${comments.length} Comment${comments.length!==1?'s':''}</strong>
                <button class="close-btn">✖</button>
              </div>
              <div class="comment-list"></div>
              <form class="comment-form">
                <input type="text" class="comment-name" placeholder="Your name (optional)" />
                <textarea class="comment-content" placeholder="Write your comment..." required></textarea>
                <button type="submit">Post Comment</button>
              </form>`;
            commentList=commentsBox.querySelector(".comment-list");
            commentsBox.querySelector(".close-btn").onclick=()=>{ commentsBox.style.display="none"; video.play().catch(()=>{}); };
            commentsBox.querySelector(".comment-form").onsubmit=async e=>{
              e.preventDefault();
              const name=commentsBox.querySelector(".comment-name").value.trim()||"Guest";
              const content=commentsBox.querySelector(".comment-content").value.trim();
              if(!content) return;
              const newComment=await postSermonComment({sermon_id:sermon.id,name,content});
              commentList.insertAdjacentHTML("afterbegin",`<div class="comment"><b>${newComment.name||"Guest"}:</b> <span>${newComment.content}</span><div class="comment-time">${new Date(newComment.created_at).toLocaleString()}</div></div>`);
              e.target.reset();
              commentCountEl.textContent=`${commentList.children.length} Comment${commentList.children.length!==1?'s':''}`;
            };
          }
          commentList.innerHTML=comments.length?comments.map(c=>`<div class="comment"><b>${c.name||"Guest"}:</b><span>${c.content}</span><div class="comment-time">${new Date(c.created_at).toLocaleString()}</div></div>`).join(""):`<p class="no-comments">No comments yet. Be the first!</p>`;
        }catch(err){console.error("Failed to load comments",err);}
      }

      commentBtn.addEventListener("click",()=>{
        const hidden = commentsBox.style.display==="none";
        if(hidden){ video.pause(); commentsBox.style.display="block"; refreshComments(); }
        else { commentsBox.style.display="none"; video.play().catch(()=>{}); }
      });

      // Share
      const shareBtn = actions.querySelector(".share-btn");
      shareBtn.addEventListener("click", async ()=>{
        const shareUrl = `${window.location.origin}/?sermon=${sermon.id}`;
        const shareData={ title: sermon.title, text: sermon.description||"Watch our latest sermon!", url: shareUrl };
        if(navigator.share){ try{ await navigator.share(shareData);}catch{} } 
        else { navigator.clipboard.writeText(shareUrl).then(()=>alert("Link copied!")); }
      });

      container.appendChild(card);
    }

    // Auto-play visible videos
    const videos = container.querySelectorAll("video");
    const playObserver = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        const vid=entry.target;
        if(entry.isIntersecting && entry.intersectionRatio>=0.7) vid.play().catch(()=>{});
        else vid.pause();
      });
    }, { threshold:0.7, root: container });
    videos.forEach(v=>playObserver.observe(v));

  }catch(err){
    console.error("Failed to load sermons:", err);
    container.innerHTML = `<p style="color:red;">Failed to load sermons</p>`;
  }
}

