import { readFileSync } from "node:fs";

const catalog = JSON.parse(
  readFileSync(
    new URL("../content/products.json", import.meta.url),
    "utf8"
  )
);

const productsById = new Map(
  catalog.map(product => [product.id, product])
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    let {
  orderId,
  customer,
  products,
  subtotal,
  shipping,
  total,
  personalization,
  deliveryNotes,
  payment
} = req.body || {};

    if (!customer?.email) {
      return res.status(400).json({
        ok: false,
        error: "Email client lipsă"
      });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Comanda nu conține produse"
      });
    }

    const checkedProducts = [];
const seenIds = new Set();

for (const item of products) {
  const product = productsById.get(item?.id);
  const quantity = item?.quantity;

  const minimum = Math.max(
    1,
    Number(product?.min_quantity) || 1
  );

  if (
    !product ||
    seenIds.has(item.id) ||
    !Number.isSafeInteger(quantity) ||
    quantity < minimum ||
    quantity > 10000 ||
    !Number.isFinite(product.price) ||
    product.price < 0
  ) {
    return res.status(400).json({
      ok: false,
      error: "Produs sau cantitate invalidă."
    });
  }

  seenIds.add(item.id);

  checkedProducts.push({
    id: product.id,
    title: product.title,
    price: product.price,
    quantity,
    image: product.images?.[0] || ""
  });
}

products = checkedProducts;

const subtotalCents = products.reduce(
  (sum, item) =>
    sum + Math.round(item.price * 100) * item.quantity,
  0
);

subtotal = subtotalCents / 100;
const digitalProductIds = new Set([
  "invitatie-digitala-nunta-muzica-animatii-whatsapp"
]);

const needsShipping = products.some(
  item => !digitalProductIds.has(item.id)
);

shipping = needsShipping ? 30 : 0;
total = (subtotalCents + shipping * 100) / 100;

    const escapeHtml = (value = "") =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const money = (value) =>
      Number(value || 0).toFixed(2);

    const productAttachments = [];

const productRows = products.map((item, index) => {
  let imageUrl = "";

  if (item.image) {
    try {
      imageUrl = new URL(
        item.image,
        "https://boundlesscollection.ro"
      ).href;
    } catch {
      imageUrl = "";
    }
  }

  const imageCid = `product-image-${index}`;

  if (imageUrl) {
    productAttachments.push({
      path: imageUrl,
      filename: `produs-${index + 1}.jpg`,
      content_id: imageCid
    });
  }

  return `
    <tr>
      <td style="
        padding:18px 0;
        border-bottom:1px solid #f1dce4;
      ">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>

            <td width="110" valign="top">
              ${
                imageUrl
                  ? `<img
                      src="cid:${imageCid}"
                      alt="${escapeHtml(item.title)}"
                      width="90"
                      height="90"
                      style="
                        width:90px;
                        height:90px;
                        object-fit:cover;
                        border-radius:12px;
                        display:block;
                      "
                    >`
                  : ""
              }
            </td>

            <td valign="top" style="
              font-family:Arial,sans-serif;
              color:#222;
              line-height:1.6;
            ">
              <strong style="font-size:16px;">
                ${escapeHtml(item.title)}
              </strong>

              <br>

              Cantitate:
              <strong>${Number(item.quantity || 1)} buc.</strong>

              <br>

              Preț:
              ${money(item.price)} RON / buc.

              <br>

              <strong>
                Subtotal:
                ${money(
                  Number(item.price || 0) *
                  Number(item.quantity || 0)
                )} RON
              </strong>
            </td>

          </tr>
        </table>
      </td>
    </tr>
  `;
}).join("");

    const customerEmailHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <body style="
        margin:0;
        padding:0;
        background:#fff8fa;
        font-family:Arial,sans-serif;
        color:#262124;
      ">

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:30px 15px;">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width:650px;
                  background:#ffffff;
                  border-radius:18px;
                  overflow:hidden;
                  border:1px solid #f3dce5;
                "
              >

                <tr>
                  <td align="center" style="
                    padding:32px 25px 20px;
                    background:#fffafb;
                  ">
                    <div style="
                      font-family:Georgia,serif;
                      font-size:28px;
                      color:#191416;
                    ">
                      Boundless Collection
                    </div>

                    <div style="
                      margin-top:8px;
                      font-size:12px;
                      text-transform:uppercase;
                      letter-spacing:2px;
                      color:#b76782;
                    ">
                      Comandă înregistrată
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;">

                    <h1 style="
                      font-family:Georgia,serif;
                      font-weight:normal;
                      font-size:25px;
                      margin:0 0 15px;
                    ">
                      Îți mulțumim pentru comandă 🤍
                    </h1>

                    <p style="line-height:1.7;color:#555;">
                      Bună, ${escapeHtml(customer.name || "")}.
                      Am primit comanda ta și vom verifica
                      toate detaliile înainte de confirmarea finală.
                    </p>

                    <p style="line-height:1.7;">
                      Număr comandă:
                      <strong>${escapeHtml(orderId || "")}</strong>
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${productRows}
                    </table>

                    <table
                      width="100%"
                      cellpadding="8"
                      cellspacing="0"
                      style="margin-top:25px;background:#fff7fa;border-radius:12px;"
                    >
                      <tr>
                        <td>Produse</td>
                        <td align="right">${money(subtotal)} RON</td>
                      </tr>

                      <tr>
                        <td>Livrare</td>
                        <td align="right">${money(shipping)} RON</td>
                      </tr>

                      <tr>
                        <td style="font-size:18px;">
                          <strong>Total</strong>
                        </td>
                        <td align="right" style="font-size:18px;">
                          <strong>${money(total)} RON</strong>
                        </td>
                      </tr>

                      <tr>
  <td style="font-size:18px;">
    <strong>Avans 50%</strong>
  </td>
  <td align="right" style="font-size:18px;">
    <strong>${money(Number(total || 0) / 2)} RON</strong>
  </td>
</tr>
                    </table>

                    <div style="
                      margin-top:25px;
                      padding:18px;
                      border-radius:12px;
                      background:#fff4f7;
                      line-height:1.7;
                    ">
                      La confirmarea comenzii se achită
                      <strong>50% avans</strong>,
                      iar diferența de
                      <strong>50% înainte de expediere</strong>.
                    </div>

                    <p style="
                      margin-top:28px;
                      line-height:1.7;
                      color:#555;
                    ">
                      Te vom contacta pentru confirmarea
                      personalizării și a detaliilor comenzii.
                    </p>

                    <p style="
                      margin-top:30px;
                      font-family:Georgia,serif;
                      font-size:18px;
                    ">
                      Cu drag,<br>
                      <strong>Boundless Collection</strong>
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `;

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <body style="
        margin:0;
        padding:25px;
        background:#f7f7f7;
        font-family:Arial,sans-serif;
        color:#222;
      ">

        <div style="
          max-width:750px;
          margin:auto;
          background:#fff;
          padding:30px;
          border-radius:16px;
        ">

          <h1 style="margin-top:0;">
            🛍️ Comandă nouă
          </h1>

          <p>
            <strong>ID comandă:</strong>
            ${escapeHtml(orderId || "")}
          </p>

          <h2>Client</h2>

          <p>
            <strong>Nume:</strong>
            ${escapeHtml(customer.name || "")}<br>

            <strong>Email:</strong>
            ${escapeHtml(customer.email || "")}<br>

            <strong>Telefon:</strong>
            ${escapeHtml(customer.phone || "")}<br>

            <strong>Adresă:</strong>
            ${escapeHtml(customer.address || "")}
          </p>

          <h2>Observații pentru livrare</h2>

<p style="white-space:pre-wrap;">
  ${escapeHtml(deliveryNotes || "Fără observații")}
</p>

<h2>Modalitate de plată</h2>

<p>
  ${escapeHtml(payment || "Nespecificată")}
</p>

          <h2>Produse</h2>

          <table width="100%" cellpadding="0" cellspacing="0">
            ${productRows}
          </table>

          ${
            personalization
              ? `
                <h2>Detalii personalizare</h2>
                <div style="
                  white-space:pre-wrap;
                  padding:15px;
                  background:#fff7fa;
                  border-radius:10px;
                ">
                  ${escapeHtml(personalization)}
                </div>
              `
              : ""
          }

          <h2>Total</h2>

          <p>
            Produse: <strong>${money(subtotal)} RON</strong><br>
            Livrare: <strong>${money(shipping)} RON</strong><br><br>

            <span style="font-size:20px;">
              Total:
              <strong>${money(total)} RON</strong>
            </span>
          </p>

          <p>
            Avans 50%:
            <strong>${money(Number(total || 0) / 2)} RON</strong>
          </p>

        </div>
      </body>
      </html>
    `;

    const headers = {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    };


    // Email către magazin
    const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL;

    if (!adminEmail) {
      throw new Error(
        "ORDER_NOTIFICATION_EMAIL nu este configurat"
      );
    }

    const adminResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: "Boundless Collection <comenzi@boundlesscollection.ro>",
          to: [adminEmail],
          reply_to: customer.email,
          subject: `🛍️ Comandă nouă ${orderId || ""} - ${customer.name || ""}`,
          html: adminEmailHtml,
  attachments: productAttachments
        })
      }
    );

    if (!adminResponse.ok) {
      const error = await adminResponse.text();

      console.error(
        "Eroare email magazin:",
        error
      );

      throw new Error("Emailul magazinului nu a putut fi trimis");
    }

        try {
  // Email către client
    const clientResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: "Boundless Collection <comenzi@boundlesscollection.ro>",
          to: [customer.email],
          subject: `Comanda ta ${orderId || ""} • Boundless Collection`,
          html: customerEmailHtml,
attachments: productAttachments
        })
      }
    );

    if (!clientResponse.ok) {
      const error = await clientResponse.text();

      console.error(
        "Eroare email client:",
        error
      );

      throw new Error("Emailul clientului nu a putut fi trimis");
    }
} catch (clientError) {
  console.error(
    "Comanda a fost trimisă magazinului, dar confirmarea clientului a eșuat:",
    clientError.message
  );
}

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error("SEND ORDER ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: "Comanda nu a putut fi trimisă."
    });
  }
}