import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    const { type, to, data } = await req.json();

    let subject = "";
    let html = "";

    if (type === "new_booking") {
      subject = `Nouvelle réservation pour "${data.listing_title}"`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #7C3AED; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Luxora</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Nouvelle réservation reçue !</h2>
            <p style="color: #6b7280;">Bonne nouvelle ! Quelqu'un vient de réserver votre article.</p>
            
            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">ARTICLE</p>
              <p style="margin: 0; font-weight: 600; color: #111827;">${data.listing_title}</p>
            </div>

            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">LOCATAIRE</p>
              <p style="margin: 0; font-weight: 600; color: #111827;">${data.renter_name}</p>
            </div>

            <div style="display: flex; gap: 12px; margin: 16px 0;">
              <div style="flex: 1; background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">DU</p>
                <p style="margin: 0; font-weight: 600; color: #111827;">${data.start_date}</p>
              </div>
              <div style="flex: 1; background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">AU</p>
                <p style="margin: 0; font-weight: 600; color: #111827;">${data.end_date}</p>
              </div>
            </div>

            <div style="background: #EDE9FE; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">MONTANT TOTAL</p>
              <p style="margin: 0; font-weight: 700; color: #7C3AED; font-size: 20px;">${data.total_price} €</p>
            </div>

            <a href="https://luxora-psi-lake.vercel.app/messages" style="display: block; background: #7C3AED; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Voir la conversation
            </a>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Luxora — Plateforme de location entre particuliers
            </p>
          </div>
        </div>
      `;
    }

    else if (type === "booking_confirmation") {
      subject = `Confirmation de votre réservation — ${data.listing_title}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #7C3AED; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Luxora</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Votre réservation est confirmée !</h2>
            <p style="color: #6b7280;">Votre demande de réservation a bien été envoyée. Le loueur va la confirmer prochainement.</p>

            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">ARTICLE RÉSERVÉ</p>
              <p style="margin: 0; font-weight: 600; color: #111827;">${data.listing_title}</p>
              <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${data.listing_city}</p>
            </div>

            <div style="display: flex; gap: 12px; margin: 16px 0;">
              <div style="flex: 1; background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">DU</p>
                <p style="margin: 0; font-weight: 600; color: #111827;">${data.start_date}</p>
              </div>
              <div style="flex: 1; background: white; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px;">AU</p>
                <p style="margin: 0; font-weight: 600; color: #111827;">${data.end_date}</p>
              </div>
            </div>

            <div style="background: #EDE9FE; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 13px;">Prix de la location</span>
                <span style="color: #111827; font-weight: 500;">${data.base_price} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 13px;">Frais de service (12%)</span>
                <span style="color: #111827; font-weight: 500;">${data.commission} €</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #DDD6FE;">
                <span style="color: #111827; font-weight: 600;">Total</span>
                <span style="color: #7C3AED; font-weight: 700; font-size: 18px;">${data.total_price} €</span>
              </div>
            </div>

            <a href="https://luxora-psi-lake.vercel.app/messages" style="display: block; background: #7C3AED; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Voir mes messages
            </a>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Luxora — Plateforme de location entre particuliers
            </p>
          </div>
        </div>
      `;
    }

    else if (type === "new_message") {
      subject = `Nouveau message de ${data.sender_name} sur Luxora`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #7C3AED; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Luxora</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Vous avez un nouveau message</h2>
            <p style="color: #6b7280;"><strong>${data.sender_name}</strong> vous a envoyé un message :</p>

            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #7C3AED;">
              <p style="margin: 0; color: #111827; font-style: italic;">"${data.message_preview}"</p>
            </div>

            <a href="https://luxora-psi-lake.vercel.app/messages" style="display: block; background: #7C3AED; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Répondre au message
            </a>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
              Luxora — Plateforme de location entre particuliers
            </p>
          </div>
        </div>
      `;
    }

    if (!subject || !html) {
      return NextResponse.json({ error: "Type d'email invalide" }, { status: 400 });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Luxora <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: emailData });

  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}