export class VoiceModel {
  public name: string;
  public id: string;
  public gender: string;
  public engine: string;
  public emotion: string;
  public language: string;

  constructor(
    name: string,
    id: string,
    gender: string,
    engine: string,
    emotion: string,
    language: string,
  ) {
    this.name = name;
    this.id = id;
    this.gender = gender;
    this.engine = engine;
    this.emotion = emotion;
    this.language = language;
  }
}
