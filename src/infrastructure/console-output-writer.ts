import { type OutputWriter } from "@/domain";

/**
 * OutputWriter implementation that writes to process.stdout.
 */
export class ConsoleOutputWriter implements OutputWriter {
  public write(text: string): void {
    process.stdout.write(text);
  }
}
