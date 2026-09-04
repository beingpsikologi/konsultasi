# MYBEING HANDOFF

Konsultasi FINAL tidak meminta user mengisi ContactID.

Saat user sudah login di MyBeing dan menekan menu Konsultasi, MyBeing perlu membuka:

    https://URL-GITHUB-KONSULTASI/index.html?contactId=CONTACT_ID

ContactID adalah parameter teknis yang tidak ditampilkan sebagai form dan tidak diminta dari user.

Alternatif yang lebih bersih bila Konsultasi ditanam sebagai iframe:
    window.BEING_MYBEING_SESSION = { contactId: currentUser.contactId };

File `assets/mybeing-bridge.js` menerima kedua pola tersebut.

CATATAN:
Source yang tersedia saat ini membuktikan backend V7 menggunakan ContactID sebagai identitas client, tetapi source MyBeing yang lengkap tidak tersedia dalam paket ini. Karena itu jangan mengarang nama localStorage MyBeing. Bridge sengaja menyediakan beberapa jalur handoff tanpa menampilkan ContactID kepada user.
