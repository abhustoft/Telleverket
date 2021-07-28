const toFirebase = item => {
        const accessToken = ScriptApp.getOAuthToken();
        const dbPost = {
            method: 'post',
            contentType: 'application/json',
            contentLength: `{"amount": "${item.amount}", "items": ${item.items}, "day":"${item.day}"}`.length,
            headers: {'Authorization': 'Bearer ' + accessToken},
            payload: `{"provider": "anonymous","uid": "${firebaseUID}","date": "${item.date}","itemPrice": "${item.itemPrice}", "items": ${item.items}, "day":"${item.day}"}`,
            muteHttpExceptions: true,
        };
        const url = `https://juniorsalg-e6134.firebaseio.com/${item.shop}/${item.week}/${item.vendor}.json`;
        const response = UrlFetchApp.fetch(url, dbPost);
        console.log('Response from Firebase: ', JSON.parse(response.getContentText()));
}
