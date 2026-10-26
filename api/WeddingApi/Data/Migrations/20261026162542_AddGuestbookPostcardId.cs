using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WeddingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestbookPostcardId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PostcardId",
                table: "guestbook_entries",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PostcardId",
                table: "guestbook_entries");
        }
    }
}
