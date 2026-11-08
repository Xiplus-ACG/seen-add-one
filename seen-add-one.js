(function() {

    function updateSeen(btn, getNewValue) {
        $(btn).prop('disabled', true);

        var api = new mw.Api();
        api.get({
            'action': 'wbgetclaims',
            'format': 'json',
            'entity': mw.config.get('wgTitle')
        }).done(function(data) {
            var claims = data['claims'];
            var guid = claims['P28'][0]['id'];
            var oldvalue = parseInt(claims['P28'][0]['mainsnak']['datavalue']['value']['amount']);
            var total = NaN;
            if (claims['P27'] && claims['P27'][0]['mainsnak']['datavalue']) {
                total = parseInt(claims['P27'][0]['mainsnak']['datavalue']['value']['amount']);
            }
            var newvalue = getNewValue(oldvalue, total);

            if (isNaN(newvalue)) {
                mw.notify('無法取得目標數值');
                return;
            }

            if (!confirm('已看集數從 ' + oldvalue + ' 改為 ' + newvalue)) {
                mw.notify('已取消');
                return;
            }

            api.postWithEditToken({
                'action': 'wbsetclaimvalue',
                'format': 'json',
                'claim': guid,
                'value': JSON.stringify({
                    'amount': '+' + newvalue,
                    'unit': '1'
                }),
                'snaktype': 'value',
            }).then(function() {
                mw.notify('成功更新');
                location.reload();
            }, function(e) {
                mw.notify('未知錯誤：' + e);
            });

        }).fail(function(e) {
            mw.notify('未知錯誤：' + e);
        }).always(function() {
            $(btn).prop('disabled', false);
        });
    }

    function seenAddOne() {
        updateSeen(this, function(oldvalue) {
            return oldvalue + 1;
        });
    }

    function seenSetMax() {
        updateSeen(this, function(oldvalue, total) {
            return Math.max(oldvalue, total);
        });
    }

    function parseValue(text) {
        return parseInt(text.replace(/[,\s]/g, ''));
    }

    var seenText = $('#P28 .wikibase-statementview-mainsnak .wikibase-snakview-value').text();
    var totalText = $('#P27 .wikibase-statementview-mainsnak .wikibase-snakview-value').text();
    var target = $('div#P28 div.wikibase-statementview-mainsnak div.wikibase-snakview-body');

    if (seenText != totalText) {
        $('<button style="margin-left: 10px;">+1</button>')
            .on('click', seenAddOne)
            .appendTo(target);

        var seen = parseValue(seenText);
        var total = parseValue(totalText);
        if (!isNaN(seen) && !isNaN(total) && Math.abs(total - seen) >= 2) {
            $('<button style="margin-left: 10px;"></button>')
                .text('=' + Math.max(seen, total))
                .on('click', seenSetMax)
                .appendTo(target);
        }
    }

}
)();
