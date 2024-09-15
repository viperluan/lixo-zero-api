export type EmailProps = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export default class Email {
  private constructor(private readonly props: EmailProps) {}

  public static criarNovoEmail(email: EmailProps) {
    return new Email(email);
  }

  public get from() {
    return this.props.from;
  }

  public get to() {
    return this.props.to;
  }

  public get subject() {
    return this.props.subject;
  }

  public get html() {
    return this.props.html;
  }
}
