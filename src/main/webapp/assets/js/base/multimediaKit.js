
define(['jquery', 'coreKit', 'underscore'], function(validation, cKit, _) {
	
	var ValueUtils = cKit.ValueUtils;
	
	var AudioPlayer = function AudioPlayer(playerOption) {
		this.playerOption = {};
		_.defaults(this.playerOption, playerOption);

		init(this.playerOption.id, this.playerOption.ogg, this.playerOption.wav, this.playerOption.mp3, this.playerOption.aac);
	};
	
	AudioPlayer.prototype.play = function() {
		var playerName = this.playerOption.id;
		
		if (-1 != navigator.userAgent.indexOf("MSIE")) {
			/* 不支持IE
			var callName = playerName + '.controls.play()';
			setTimeout(callName, 10);
			*/
		} else {
			if ($('#' + playerName).length > 0) {
				$('#' + playerName).get(0).play();
			}
		}
	};
	AudioPlayer.prototype.onended = function(fn){
		var playerName = this.playerOption.id;
		
		if (-1 != navigator.userAgent.indexOf("MSIE")) {
			/* 不支持IE
			var callName = playerName + '.controls.play()';
			setTimeout(callName, 10);
			*/
		} else {
			if ($('#' + playerName).length > 0) {
				$('#' + playerName).get(0).onended = function(){
					fn();
				};
			}
		}
	};
	// playerName variable that defines a player instance
	var init = function init(playerName, oggFileName, wavFileName, mp3FileName, aacFileName) {
		
		if ((-1 != navigator.userAgent.indexOf("MSIE")) && (!ValueUtils.isEmpty(wavFileName))) {
			// 如果是IE，并且提供了wav文件
			/* 不支持IE
			var node = '<OBJECT id="' + playerName + 
				'" classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6"' + 
				' width="0" height="0" style="display:none;" > <param name="URL" value="' + wavFileName + 
				'" /> <param name="AutoStart" value="false" /> </OBJECT>';
			$('body').append(node);
			*/
		} else {
			var str = '<audio id="' + playerName + 
				'" controls="controls" preload="auto" style="position:absolute; visibility:hidden;">';
			
			if (!ValueUtils.isEmpty(oggFileName)) {
				str = str + '<source src="' + oggFileName + '" type="audio/ogg"></source>';
			}
			
			if (!ValueUtils.isEmpty(wavFileName)) {
				str = str + '<source src="' + wavFileName + '" type="audio/wav"></source>';
			}
	
			if (!ValueUtils.isEmpty(mp3FileName)) {
				str = str + '<source src="' + mp3FileName + '" type="audio/mp3"></source>';
			}
	
			if (!ValueUtils.isEmpty(aacFileName)) {
				str = str + '<source src="' + aacFileName + '" type="audio/aac"></source>';
			}
			
			str = str + '</audio>';
	
			$('body').append(str);
		}
	};

	return {
		AudioPlayer : AudioPlayer
	};
});