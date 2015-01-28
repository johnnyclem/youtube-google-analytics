
var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var videoArray = new Array();
var playerArray = new Array();
var videoTitle = new Array();

function trackYouTube()
{
  var i = 0;
  jQuery('iframe').each(function() {
    if($(this).attr('src')){
      var video = $(this);
      var vidSrc = video.attr('src');
      var regex = /(?:https?:)?\/\/www\.youtube\.com\/embed\/([\w-]{11})(?:\?.*)?/;
      var matches = vidSrc.match(regex);
      if(matches && matches.length > 1){
        videoArray[i] = matches[1];
        video.attr('id', matches[1]);
        getRealTitles(i);
        i++;
      }
    }
  });
}

function getRealTitles(j) {
  var tempJSON = $.getJSON('http://gdata.youtube.com/feeds/api/videos/'+videoArray[j]+'?v=2&alt=json',function(data,status,xhr){
    videoTitle[j] = data.entry.title.$t;
    playerArray[j] = new YT.Player(videoArray[j], {
      videoId: videoArray[j],
      events: {
        'onStateChange': onPlayerStateChange,
        'onPlaybackQualityChange': onPlaybackQualityChange,
        'onPlaybackRateChange': onPlaybackRateChange,
        'onError': onError
      }
    });
  });
}

$(window).load(function() {
  trackYouTube();
});

var pauseFlagArray = new Array();

function onPlaybackQualityChange(event) {
  ga('send', 'event', 'Videos', 'Change Quality | ' + event.data, getVideoTitle(event));
}

function onPlaybackRateChange(event) {
  ga('send', 'event', 'Videos', 'Change Playback Rate | ' + event.data + 'x', getVideoTitle(event));
}

function onError(event) {
  var errorMessage = "";
  switch (event.data) {
    case 2:
      errorMessage = "invalid parameter value"
      break;
    case 5:
      errorMessage = "HTML5 player error"
      break;
    case 100:
      errorMessage = "video not found"
      break;
    case 101:
      errorMessage = "video not allowed in embedded players"
      break;
    case 150:
      errorMessage = "video not allowed in embedded players"
      break;
  }
  ga('send', 'event', 'Videos', 'Playback Error | ' + errorMessage, getVideoTitle(event));
}

function getVideoTitle(event) {
  var videoURL = event.target.getVideoUrl();
  var regex = /v=(.+)$/;
  var matches = videoURL.match(regex);
  videoID = matches[1];
  thisVideoTitle = "";
  for (j=0; j<videoArray.length; j++) {
    if (videoArray[j]==videoID) {
      thisVideoTitle = videoTitle[j]||"";
      var longTitle = thisVideoTitle + " | " + videoID;
      thisVideoTitle = thisVideoTitle.length > 0 ? longTitle : videoID
    }
  }
  return thisVideoTitle;
}

function onPlayerStateChange(event) {
  thisVideoTitle = getVideoTitle(event);
  switch(event.data) {
    case YT.PlayerState.PLAYING:
      ga('send', 'event', 'Videos', 'Play', thisVideoTitle);
      pauseFlagArray[j] = false;
      break;
    case YT.PlayerState.ENDED:
      ga('send', 'event', 'Videos', 'Watch to End', thisVideoTitle);
      break;
    case YT.PlayerState.PAUSED:
      if (pauseFlagArray[j] != true) {
        ga('send', 'event', 'Videos', 'Pause | ' + Math.round(event.target.getCurrentTime()), thisVideoTitle);
        pauseFlagArray[j] = true;
      }
      break;
    case YT.PlayerState.BUFFERING:
      ga('send', 'event', 'Videos', 'Buffering', thisVideoTitle);
      break;
    case YT.PlayerState.CUED:
      ga('send', 'event', 'Videos', 'Cueing', thisVideoTitle);
      break;
  }
}
